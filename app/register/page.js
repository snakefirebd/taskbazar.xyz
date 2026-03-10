// File Path: app/register/page.js

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
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

// Import Header and Footer from headfoot.js
import { Header, Footer } from '../../components/headfoot';

// Firebase Config
let firebaseConfig = {};
try {
    firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
} catch (error) {
    console.error("Firebase config parse error:", error);
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app); // Realtime Database
const appId = firebaseConfig.projectId; 

const translations = {
    bn: {
        points: "পয়েন্ট",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu"
    },
    en: {
        points: "Points",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu"
    }
};

export default function RegisterPage() {
    const router = useRouter();

    // Global States
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ points: 0, name: "Guest", avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png" });
    const [currentLang, setCurrentLang] = useState('bn');
    const [navOpen, setNavOpen] = useState(false);
    const [hasNewNotif, setHasNewNotif] = useState(false);

    // UI States
    const [view, setView] = useState('auth-view'); 
    const [toast, setToast] = useState({ msg: "", visible: false });
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [name, setName] = useState("");
    const [referCode, setReferCode] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const t = translations[currentLang];

    useEffect(() => {
        const savedLang = localStorage.getItem('elite_lang') || 'bn';
        setCurrentLang(savedLang);

        // URL থেকে রেফারেল কোড অটো-ফিল করা
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const refParam = params.get('ref');
            if (refParam) {
                setReferCode(refParam);
            }
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                if (currentUser.emailVerified) {
                    router.push('/'); 
                } else {
                    setView('verify-view'); 
                }
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const changeLang = (lang) => {
        setCurrentLang(lang);
        localStorage.setItem('elite_lang', lang);
    };

    const toggleMenu = () => setNavOpen(!navOpen);
    
    const openNotifications = () => {
        showToast(currentLang === 'bn' ? "লগইন করার পর নোটিফিকেশন দেখতে পাবেন।" : "Login to view notifications.");
    };

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast({ msg: "", visible: false }), 3000);
    };

    // ফায়ারবেস রিয়েলটাইম ডাটাবেজের মাধ্যমে রেফারেল প্রসেস
    const processReferral = async (referCodeInput, newUserId, newUserName) => {
        if (!referCodeInput || !appId) return;

        try {
            const usersRef = ref(db, `artifacts/${appId}/users`);
            const referQuery = query(usersRef, orderByChild('stats/referralCode'), equalTo(referCodeInput), limitToFirst(1));
            const snapshot = await get(referQuery);
            const referrerDataMap = snapshot.val();

            if (referrerDataMap) {
                const referrerUid = Object.keys(referrerDataMap)[0];

                if (referrerUid === newUserId) return;

                const newReferralRef = push(ref(db, `artifacts/${appId}/users/${referrerUid}/referrals`));
                await set(newReferralRef, {
                    userId: newUserId,
                    userName: newUserName,
                    timestamp: serverTimestamp()
                });

                const referrerStatsRef = ref(db, `artifacts/${appId}/users/${referrerUid}/stats/totalReferrals`);
                await runTransaction(referrerStatsRef, (currentCount) => {
                    return (currentCount || 0) + 1;
                });

                await set(ref(db, `artifacts/${appId}/users/${newUserId}/stats/referredBy`), referrerUid);
                console.log("Referral processed directly in Realtime Database!");
            } else {
                showToast(currentLang === 'bn' ? "ভুল রেফার কোড ব্যবহার করা হয়েছে!" : "Invalid referral code!");
            }
        } catch (error) {
            console.error("Referral Error:", error);
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const additionalInfo = getAdditionalUserInfo(result);

            if (additionalInfo?.isNewUser && appId) {
                const rCode = referCode.trim();

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
                showToast(currentLang === 'bn' ? "Google অ্যাকাউন্ট সফলভাবে খোলা হয়েছে! 🎉" : "Google Account created successfully! 🎉");
            } else {
                showToast(currentLang === 'bn' ? "লগইন সফল হয়েছে! ✅" : "Login successful! ✅");
            }
        } catch (error) {
            showToast("Google Login Error: " + error.message);
        }
    };

    const handleRegister = async () => {
        const e = email.trim();
        const p = password.trim();
        const n = name.trim();
        const rCode = referCode.trim();

        if (!n) return showToast(currentLang === 'bn' ? "আপনার নাম লেখা বাধ্যতামূলক!" : "Name is required!");
        if (!e || p.length < 6) return showToast(currentLang === 'bn' ? "সঠিক ইমেইল এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড প্রয়োজন!" : "Valid email and at least 6 characters password required!");

        setIsLoading(true);

        try {
            const res = await createUserWithEmailAndPassword(auth, e, p);

            if (appId) {
                await set(ref(db, `artifacts/${appId}/users/${res.user.uid}/stats`), {
                    name: n, 
                    points: 0,
                    referralCode: res.user.uid.substring(0, 6).toUpperCase(), 
                    totalReferrals: 0,
                    createdAt: serverTimestamp()
                });

                if (rCode) {
                    await processReferral(rCode, res.user.uid, n);
                }
            }

            await sendEmailVerification(res.user);
            showToast(currentLang === 'bn' ? "ভেরিফিকেশন ইমেইল পাঠানো হয়েছে!" : "Verification email sent!");

            setView('verify-view');
        } catch (err) { 
            let errorMsg = err.message;
            if(err.code === 'auth/email-already-in-use') errorMsg = currentLang === 'bn' ? "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে!" : "Email already in use!";
            showToast(errorMsg); 
        } finally {
            setIsLoading(false);
        }
    };

    const reloadUser = async () => {
        const user = auth.currentUser;
        if (user) {
            await user.reload();
            if (user.emailVerified) { 
                router.push('/'); 
            } else { 
                showToast(currentLang === 'bn' ? "প্রথমে আপনার ইমেইল ভেরিফাই করুন!" : "Please verify your email first!"); 
            }
        }
    };

    const resendVerification = async () => {
        const user = auth.currentUser;
        if (user) {
            try { 
                await sendEmailVerification(user); 
                showToast(currentLang === 'bn' ? "ভেরিফিকেশন লিঙ্ক আবার পাঠানো হয়েছে!" : "Verification link sent again!"); 
            } catch (err) { 
                showToast(err.message); 
            }
        }
    };

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
                body { background: var(--bg); color: var(--text-h); line-height: 1.6; padding-bottom: 90px; }
                .page-container { width: 100%; min-height: calc(100vh - 180px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
                .elite-card { background: var(--glass); backdrop-filter: blur(20px); border-radius: 22px; padding: 25px; width: 100%; max-width: 400px; border: 1px solid rgba(255,255,255,0.7); box-shadow: 0 8px 30px rgba(0,0,0,0.05); animation: fadeIn 0.5s ease-out; margin: 0 auto; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .btn-elite { width: 100%; padding: 14px; border: none; border-radius: 16px; background: var(--p-gradient); color: white; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: 0.3s; box-shadow: var(--p-glow); margin-top: 10px; }
                .btn-elite:active { transform: scale(0.97); }
                .btn-elite:disabled { opacity: 0.7; cursor: not-allowed; }
                .btn-ghost { background: #f1f5f9; color: var(--text-p); box-shadow: none; margin-top: 15px; }
                .input-group { margin-bottom: 14px; text-align: left; }
                .input-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-p); margin-bottom: 5px; margin-left: 5px; }
                .input-group input { width: 100%; padding: 14px 18px; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 15px; outline: none; transition: 0.3s; font-size: 0.9rem; }
                .input-group input:focus { border-color: #6366f1; }
                #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 12px 24px; border-radius: 50px; font-size: 0.8rem; font-weight: 600; z-index: 4000; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: opacity 0.3s ease; }
            `}</style>

            {toast.visible && <div id="toast">{toast.msg}</div>}

            <Header 
                user={user} 
                userData={userData} 
                hasNewNotif={hasNewNotif} 
                openNotifications={openNotifications} 
                currentLang={currentLang} 
                changeLang={changeLang} 
                t={t} 
                router={router} 
            />

            <div className="page-container">
                {view === 'auth-view' && (
                    <div style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'var(--p-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TaskBazar</h1>
                            <p style={{ color: 'var(--text-p)', fontWeight: 600, fontSize: '0.9rem' }}>{currentLang === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create your account'}</p>
                        </div>

                        <div className="elite-card">
                            <div>
                                <div className="input-group">
                                    <label>{currentLang === 'bn' ? 'সম্পূর্ণ নাম' : 'Full Name'}</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={currentLang === 'bn' ? "আপনার নাম লিখুন" : "Enter your name"} />
                                </div>
                                <div className="input-group">
                                    <label>{currentLang === 'bn' ? 'রেফার কোড (ঐচ্ছিক)' : 'Referral Code (Optional)'}</label>
                                    <input type="text" value={referCode} onChange={(e) => setReferCode(e.target.value)} placeholder={currentLang === 'bn' ? "কোড থাকলে দিন" : "Enter code if any"} />
                                </div>
                                <div className="input-group">
                                    <label>{currentLang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                                </div>
                                <div className="input-group">
                                    <label>{currentLang === 'bn' ? 'গোপন পাসওয়ার্ড' : 'Secret Password'}</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                                </div>

                                <button className="btn-elite" onClick={handleRegister} disabled={isLoading}>
                                    {isLoading ? (currentLang === 'bn' ? "অপেক্ষা করুন..." : "Please wait...") : (currentLang === 'bn' ? "অ্যাকাউন্ট তৈরি করুন" : "Create Account")}
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                                    <span style={{ padding: '0 10px', color: 'var(--text-p)', fontSize: '0.8rem', fontWeight: 800 }}>
                                        {currentLang === 'bn' ? 'অথবা' : 'OR'}
                                    </span>
                                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                                </div>

                                <button onClick={handleGoogleSignIn} style={{ width: '100%', padding: '12px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: '0.3s', fontSize: '0.9rem' }}>
                                    <img src="https://cdn4.iconfinder.com/data/icons/logos-brands-7/512/google_logo-google_icongoogle-512.png" style={{ width: '20px', height: '20px' }} alt="Google" />
                                    {currentLang === 'bn' ? 'Google দিয়ে কন্টিনিউ করুন' : 'Continue with Google'}
                                </button>
                            </div>

                            <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-p)', fontWeight: 600 }}>
                                    {currentLang === 'bn' ? 'আগেই অ্যাকাউন্ট আছে?' : 'Already a member?'} <span onClick={() => router.push('/login')} style={{ color: '#6366f1', fontWeight: 800, cursor: 'pointer' }}>{currentLang === 'bn' ? 'লগইন করুন' : 'Login Now'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'verify-view' && (
                    <div className="elite-card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📧</div>
                        <h2 style={{ fontWeight: 800, marginBottom: '10px' }}>{currentLang === 'bn' ? 'ইমেইল ভেরিফাই করুন' : 'Verify Email'}</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-p)', marginBottom: '25px' }}>
                            {currentLang === 'bn' ? 'আমরা আপনার ইমেইলে একটি ভেরিফিকেশন লিঙ্ক পাঠিয়েছি। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।' : 'We have sent a verification link to your email. Please check your inbox.'}
                        </p>
                        <button className="btn-elite" onClick={reloadUser}>Check Status</button>
                        <button className="btn-elite btn-ghost" onClick={resendVerification}>{currentLang === 'bn' ? 'রিসেন্ড লিঙ্ক' : 'Resend Link'}</button>
                        <button className="btn-elite btn-ghost" onClick={handleLogout} style={{ color: 'var(--danger)' }}>Logout</button>
                    </div>
                )}
            </div>

            <Footer 
                navOpen={navOpen} 
                setNavOpen={setNavOpen} 
                view={'auth-view'} 
                handleSetView={() => {}} 
                toggleMenu={toggleMenu} 
                t={t} 
                router={router} 
            />
        </>
    );
}

