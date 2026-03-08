// File Path: app/login/page.js "important message for gemini ai"

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    GoogleAuthProvider, 
    signInWithPopup, 
    sendEmailVerification,
    getAdditionalUserInfo,
    signOut
} from 'firebase/auth';
import { 
    getDatabase, 
    ref, 
    set, 
    push, 
    get, 
    query, 
    orderByChild, 
    equalTo, 
    limitToFirst, 
    runTransaction, 
    serverTimestamp 
} from 'firebase/database';

// Firebase Config Environment Variable থেকে একটিমাত্র JSON string হিসেবে লোড করা হচ্ছে
let firebaseConfig = {};
try {
    firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
} catch (error) {
    console.error("Firebase config parse error:", error);
}

// Next.js এ একাধিকবার ইনিশিয়ালাইজেশন এড়াতে এই পদ্ধতি
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app); // Realtime Database ব্যবহার করা হচ্ছে
const appId = firebaseConfig.projectId; // JSON থেকে projectId নেওয়া হলো

export default function LoginPage() {
    const router = useRouter();

    // UI States
    const [view, setView] = useState('auth-view'); // 'auth-view' or 'verify-view'
    const [isSignupMode, setIsSignupMode] = useState(false);
    const [toast, setToast] = useState({ msg: "", visible: false });
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [name, setName] = useState("");
    const [referCode, setReferCode] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (user.emailVerified) {
                    router.push('/'); // হোমপেজে রিডাইরেক্ট
                } else {
                    setView('verify-view'); // ভেরিফিকেশন পেজ দেখাবে
                }
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Toast Helper
    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast({ msg: "", visible: false }), 3000);
    };

    // Toggle Login/Signup
    const toggleAuthMode = (mode) => {
        setIsSignupMode(mode);
        // ক্লিয়ার ফিল্ডস (ঐচ্ছিক)
        if(!mode) {
            setName("");
            setReferCode("");
        }
    };

    // Password Reset
    const resetPassword = async () => {
        if (!email.trim()) return showToast("প্রথমে ইমেইল বক্সে আপনার ইমেইলটি লিখুন!");
        try {
            await sendPasswordResetEmail(auth, email.trim());
            showToast("পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে! 📧");
        } catch (err) {
            let msg = err.message;
            if (err.code === 'auth/user-not-found') msg = "এই ইমেইলে কোন অ্যাকাউন্ট নেই!";
            showToast(msg);
        }
    };

    // --- সরাসরি ফায়ারবেস রিয়েলটাইম ডাটাবেজের মাধ্যমে রেফারেল প্রসেস ---
    const processReferral = async (referCodeInput, newUserId, newUserName) => {
        if (!referCodeInput || !appId) return;

        try {
            // ১. রেফার কোড দিয়ে আসল ইউজারকে খুঁজে বের করা
            const usersRef = ref(db, `artifacts/${appId}/users`);
            const referQuery = query(usersRef, orderByChild('stats/referralCode'), equalTo(referCodeInput), limitToFirst(1));
            const snapshot = await get(referQuery);
            const referrerDataMap = snapshot.val();

            if (referrerDataMap) {
                const referrerUid = Object.keys(referrerDataMap)[0];

                // নিজের কোড নিজে ব্যবহার করলে বাতিল
                if (referrerUid === newUserId) {
                    console.log("Self referral detected, skipping.");
                    return;
                }

                // ২. রেফারকারীর লিস্টে নতুন ইউজারের নাম যুক্ত করা
                const newReferralRef = push(ref(db, `artifacts/${appId}/users/${referrerUid}/referrals`));
                await set(newReferralRef, {
                    userId: newUserId,
                    userName: newUserName,
                    timestamp: serverTimestamp()
                });

                // ৩. রেফারকারীর totalReferrals সংখ্যা ১ বাড়ানো (Transaction ব্যবহার করে)
                const referrerStatsRef = ref(db, `artifacts/${appId}/users/${referrerUid}/stats/totalReferrals`);
                await runTransaction(referrerStatsRef, (currentCount) => {
                    return (currentCount || 0) + 1;
                });

                // ৪. নতুন ইউজারকে মার্ক করা যে সে কার রেফারে এসেছে
                await set(ref(db, `artifacts/${appId}/users/${newUserId}/stats/referredBy`), referrerUid);

                console.log("Referral processed directly in Realtime Database!");
            } else {
                showToast("ভুল রেফার কোড ব্যবহার করা হয়েছে!");
            }
        } catch (error) {
            console.error("Referral Error:", error);
        }
    };

    // Google Sign-In
    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const additionalInfo = getAdditionalUserInfo(result);

            // যদি নতুন ইউজার হয় তবে সরাসরি ডাটাবেজে তথ্য সেভ করা হবে
            if (additionalInfo?.isNewUser && appId) {
                const rCode = referCode.trim();

                // ডাটাবেজ তৈরি
                await set(ref(db, `artifacts/${appId}/users/${user.uid}/stats`), {
                    name: user.displayName || "Google User", 
                    points: 0, 
                    referralCode: user.uid.substring(0, 6).toUpperCase(), 
                    totalReferrals: 0,
                    createdAt: serverTimestamp(),
                    avatar: user.photoURL || "" 
                });

                if (rCode) {
                    await processReferral(rCode, user.uid, user.displayName || "Google User");
                }
                showToast("Google অ্যাকাউন্ট সফলভাবে খোলা হয়েছে! 🎉");
            } else {
                showToast("লগইন সফল হয়েছে! ✅");
            }
        } catch (error) {
            showToast("Google Login Error: " + error.message);
        }
    };

    // Email & Password Auth Action
    const handleAuthAction = async () => {
        const e = email.trim();
        const p = password.trim();

        if (!e || p.length < 6) return showToast("সঠিক ইমেইল এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড প্রয়োজন!");

        setIsLoading(true);

        try {
            if (isSignupMode) {
                const n = name.trim();
                const rCode = referCode.trim();

                if (!n) {
                    setIsLoading(false);
                    return showToast("আপনার নাম লেখা বাধ্যতামূলক!");
                }

                const res = await createUserWithEmailAndPassword(auth, e, p);

                // ফ্রন্টএন্ড থেকে সরাসরি ডাটাবেজে প্রোফাইল তৈরি করা
                if (appId) {
                    await set(ref(db, `artifacts/${appId}/users/${res.user.uid}/stats`), {
                        name: n, 
                        points: 0,
                        referralCode: res.user.uid.substring(0, 6).toUpperCase(), 
                        totalReferrals: 0,
                        createdAt: serverTimestamp()
                    });

                    // রেফারেল প্রসেস করা
                    if (rCode) {
                        await processReferral(rCode, res.user.uid, n);
                    }
                }

                await sendEmailVerification(res.user);
                showToast("ভেরিফিকেশন ইমেইল পাঠানো হয়েছে!");

                setView('verify-view');
            } else { 
                // লগইন মোড
                await signInWithEmailAndPassword(auth, e, p);
                // On success, the onAuthStateChanged listener will redirect
            }
        } catch (err) { 
            let errorMsg = err.message;
            if(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') errorMsg = "পাসওয়ার্ড বা ইমেইল ভুল হয়েছে!";
            if(err.code === 'auth/user-not-found') errorMsg = "এই ইমেইলে কোন অ্যাকাউন্ট নেই!";
            if(err.code === 'auth/email-already-in-use') errorMsg = "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে!";
            showToast(errorMsg); 
        } finally {
            setIsLoading(false);
        }
    };

    // Check Verification Status
    const reloadUser = async () => {
        const user = auth.currentUser;
        if (user) {
            await user.reload();
            if (user.emailVerified) { 
                router.push('/'); 
            } else { 
                showToast("প্রথমে আপনার ইমেইল ভেরিফাই করুন!"); 
            }
        }
    };

    // Resend Verification Email
    const resendVerification = async () => {
        const user = auth.currentUser;
        if (user) {
            try { 
                await sendEmailVerification(user); 
                showToast("ভেরিফিকেশন লিঙ্ক আবার পাঠানো হয়েছে!"); 
            } catch (err) { 
                showToast(err.message); 
            }
        }
    };

    // Logout
    const handleLogout = async () => {
        await signOut(auth);
        window.location.reload();
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
                
                :root {
                    --p-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    --p-glow: 0 0 20px rgba(99, 102, 241, 0.4);
                    --bg: #f8fafc;
                    --glass: rgba(255, 255, 255, 0.85);
                    --text-h: #0f172a;
                    --text-p: #64748b;
                    --accent: #10b981;
                    --danger: #f43f5e;
                }

                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
                body { background: var(--bg); color: var(--text-h); line-height: 1.6; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }

                .elite-card {
                    background: var(--glass); backdrop-filter: blur(20px); border-radius: 22px; padding: 25px;
                    width: 100%; max-width: 400px; border: 1px solid rgba(255,255,255,0.7);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.05);
                    animation: fadeIn 0.5s ease-out;
                    margin: 0 auto;
                }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                .btn-elite {
                    width: 100%; padding: 14px; border: none; border-radius: 16px;
                    background: var(--p-gradient); color: white; font-size: 0.95rem; font-weight: 700;
                    cursor: pointer; transition: 0.3s; box-shadow: var(--p-glow);
                    margin-top: 10px;
                }
                .btn-elite:active { transform: scale(0.97); }
                .btn-elite:disabled { opacity: 0.7; cursor: not-allowed; }
                .btn-ghost { background: #f1f5f9; color: var(--text-p); box-shadow: none; margin-top: 15px; }

                .input-group { margin-bottom: 14px; text-align: left; }
                .input-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-p); margin-bottom: 5px; margin-left: 5px; }
                .input-group input {
                    width: 100%; padding: 14px 18px; background: #fff; border: 1.5px solid #e2e8f0;
                    border-radius: 15px; outline: none; transition: 0.3s; font-size: 0.9rem;
                }
                .input-group input:focus { border-color: #6366f1; }

                #toast {
                    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                    background: #1e293b; color: white; padding: 12px 24px; border-radius: 50px;
                    font-size: 0.8rem; font-weight: 600; z-index: 3000;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    transition: opacity 0.3s ease;
                }
                
                .page-container { width: 100%; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            `}</style>

            {/* Toast Notification */}
            {toast.visible && <div id="toast">{toast.msg}</div>}

            <div className="page-container">
                {/* Authentication View */}
                {view === 'auth-view' && (
                    <div style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'var(--p-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TaskBazar</h1>
                            <p style={{ color: 'var(--text-p)', fontWeight: 600, fontSize: '0.9rem' }}>The Premium Micro-Task Platform</p>
                        </div>

                        <div className="elite-card">
                            <div>
                                {isSignupMode && (
                                    <>
                                        <div className="input-group">
                                            <label>সম্পূর্ণ নাম</label>
                                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার নাম লিখুন" />
                                        </div>
                                        <div className="input-group">
                                            <label>রেফার কোড (ঐচ্ছিক)</label>
                                            <input type="text" value={referCode} onChange={(e) => setReferCode(e.target.value)} placeholder="কোড থাকলে দিন" />
                                        </div>
                                    </>
                                )}
                                <div className="input-group">
                                    <label>ইমেইল অ্যাড্রেস</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                                </div>
                                <div className="input-group">
                                    <label>গোপন পাসওয়ার্ড</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                                </div>

                                <button className="btn-elite" onClick={handleAuthAction} disabled={isLoading}>
                                    {isLoading ? "Please wait..." : (isSignupMode ? "Create Account" : "Login")}
                                </button>

                                {!isSignupMode && (
                                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                                        <span onClick={resetPassword} style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}>পাসওয়ার্ড ভুলে গেছেন?</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                                    <span style={{ padding: '0 10px', color: 'var(--text-p)', fontSize: '0.8rem', fontWeight: 800 }}>অথবা</span>
                                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                                </div>

                                <button onClick={handleGoogleSignIn} style={{ width: '100%', padding: '12px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: '0.3s', fontSize: '0.9rem' }}>
                                    <img src="https://cdn4.iconfinder.com/data/icons/logos-brands-7/512/google_logo-google_icongoogle-512.png" style={{ width: '20px', height: '20px' }} alt="Google" />
                                    Google দিয়ে কন্টিনিউ করুন
                                </button>
                            </div>

                            <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-p)', fontWeight: 600 }}>
                                    {isSignupMode ? (
                                        <>Already a member? <span onClick={() => toggleAuthMode(false)} style={{ color: '#6366f1', fontWeight: 800, cursor: 'pointer' }}>Login Now</span></>
                                    ) : (
                                        <>New to the community? <span onClick={() => toggleAuthMode(true)} style={{ color: '#6366f1', fontWeight: 800, cursor: 'pointer' }}>Register Now</span></>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification View */}
                {view === 'verify-view' && (
                    <div className="elite-card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📧</div>
                        <h2 style={{ fontWeight: 800, marginBottom: '10px' }}>ইমেইল ভেরিফাই করুন</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-p)', marginBottom: '25px' }}>আমরা আপনার ইমেইলে একটি ভেরিফিকেশন লিঙ্ক পাঠিয়েছি। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।</p>
                        <button className="btn-elite" onClick={reloadUser}>Check Status</button>
                        <button className="btn-elite btn-ghost" onClick={resendVerification}>রিসেন্ড লিঙ্ক</button>
                        <button className="btn-elite btn-ghost" onClick={handleLogout} style={{ color: 'var(--danger)' }}>Logout</button>
                    </div>
                )}
            </div>
        </>
    );
}