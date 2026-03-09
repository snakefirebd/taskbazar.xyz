// File Path: app/order/page.js "important message for gemini ai"

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';

// Firebase Config Environment Variable থেকে একটিমাত্র JSON string হিসেবে লোড করা হচ্ছে
let firebaseConfig = {};
try {
    firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
} catch (error) {
    console.error("Firebase config parse error:", error);
}

// Next.js এ একাধিকবার ইনিশিয়ালাইজেশন এড়াতে
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app); // Realtime Database ব্যবহার করা হচ্ছে
const appId = firebaseConfig.projectId; // JSON থেকে projectId নেওয়া হলো

const taskRates = { 
    "YouTube Subscribe": 5, 
    "Facebook Like": 3, 
    "Telegram Join": 4, 
    "App Install": 10 
};

const translations = {
    bn: {
        points: "পয়েন্ট",
        title: "নতুন ক্যাম্পেইন তৈরি করুন",
        cat: "অ্যাকশন ক্যাটাগরি",
        itemTitle: "ক্যাম্পেইন টাইটেল",
        url: "সরাসরি লিঙ্ক (URL)",
        qty: "টার্গেট পরিমাণ (নূন্যতম ১০)",
        totalCost: "মোট খরচ",
        btnSubmit: "লঞ্চ ক্যাম্পেইন 🚀",
        processing: "প্রসেসিং...",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        loginFirst: "প্রথমে লগইন করুন!",
        fillAll: "ফর্মের সবগুলো তথ্য পূরণ করুন!",
        minQty: "পরিমাণ কমপক্ষে ১০ হতে হবে!",
        noPoints: "আপনার পর্যাপ্ত পয়েন্ট নেই!",
        success: "ক্যাম্পেইন সফল হয়েছে! ✅",
        networkError: "ইন্টারনেট কানেকশন চেক করুন!"
    },
    en: {
        points: "Points",
        title: "Create New Campaign",
        cat: "Action Category",
        itemTitle: "Campaign Title",
        url: "Direct Link (URL)",
        qty: "Target Quantity (Min 10)",
        totalCost: "Total Cost",
        btnSubmit: "Launch Campaign 🚀",
        processing: "Processing...",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        loginFirst: "Please login first!",
        fillAll: "Please fill all fields!",
        minQty: "Quantity must be at least 10!",
        noPoints: "Not enough points!",
        success: "Campaign successful! ✅",
        networkError: "Network Error!"
    }
};

export default function OrderPage() {
    const router = useRouter();

    // User & Global States
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ points: 0, name: "Elite Member", avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png" });
    const [currentLang, setCurrentLang] = useState('bn');
    const [navOpen, setNavOpen] = useState(false);

    // Form States
    const [orderType, setOrderType] = useState("YouTube Subscribe");
    const [orderTitle, setOrderTitle] = useState("");
    const [orderLink, setOrderLink] = useState("");
    const [orderQty, setOrderQty] = useState("");

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", isSuccess: false, visible: false, shakeKey: 0 });

    const t = translations[currentLang];

    // Auth & Data Fetching (Realtime Database)
    useEffect(() => {
        const savedLang = localStorage.getItem('elite_lang') || 'bn';
        setCurrentLang(savedLang);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && appId) { // appId চেক করে নেওয়া হচ্ছে
                setUser(currentUser);
                const statsRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/stats`);
                onValue(statsRef, (snap) => {
                    const data = snap.val() || {};
                    setUserData({
                        points: data.points || 0,
                        name: data.name || "Elite Member",
                        avatar: (data.avatar && data.avatar !== "null" && data.avatar !== "undefined") ? data.avatar : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    });
                });
            } else if (!currentUser) {
                router.push('/login'); // লগইন না থাকলে লগইন পেজে পাঠাবে
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Calculate Total Cost
    const totalCost = (parseInt(orderQty) || 0) * (taskRates[orderType] || 0);

    // Change Language
    const changeLang = (lang) => {
        setCurrentLang(lang);
        localStorage.setItem('elite_lang', lang);
        setMessage({ ...message, visible: false }); // হাইড মেসেজ অন ল্যাং চেঞ্জ
    };

    // Show Inline Message
    const showMessage = (msg, isSuccess = false) => {
        setMessage({ 
            text: msg, 
            isSuccess, 
            visible: true, 
            shakeKey: isSuccess ? message.shakeKey : message.shakeKey + 1 // Error হলে shake অ্যানিমেশন রিস্টার্ট করার জন্য
        });
        setTimeout(() => {
            setMessage(prev => ({ ...prev, visible: false }));
        }, 4000);
    };

    // Place Order Form Submission
    const placeOrder = async () => {
        setMessage({ ...message, visible: false });

        if (!user || !appId) return showMessage(t.loginFirst, false);

        const qtyInt = parseInt(orderQty) || 0;
        const reward = Math.max(1, (taskRates[orderType] || 1) - 1);

        if (!orderTitle.trim() || !orderLink.trim()) {
            return showMessage(t.fillAll, false);
        }
        if (qtyInt < 10) {
            return showMessage(t.minQty, false);
        }
        if (totalCost > userData.points) {
            return showMessage(t.noPoints, false);
        }

        setIsLoading(true);

        try {
            const token = await user.getIdToken();
            const response = await fetch('https://taskbajar-backend.vercel.app/api/create-campaign', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: orderTitle.trim(),
                    type: orderType,
                    link: orderLink.trim(),
                    qty: qtyInt,
                    totalCost: totalCost,
                    reward: reward
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(data.error || "Server Error!", false);
            } else {
                showMessage(t.success, true);
                setOrderTitle("");
                setOrderLink("");
                setOrderQty("");
            }
        } catch (err) {
            showMessage(t.networkError, false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
                
                :root {
                    --p-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    --p-glow: 0 0 20px rgba(99, 102, 241, 0.4);
                    --bg: #f8fafc;
                    --text-h: #0f172a;
                    --text-p: #64748b;
                    --danger: #f43f5e;
                    --accent: #10b981;
                }

                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
                body { background: var(--bg); color: var(--text-h); line-height: 1.6; padding-bottom: 120px; overflow-x: hidden; }

                /* Header Style */
                .header {
                    background: var(--p-gradient); color: white; padding: 12px 15px 25px;
                    border-bottom-left-radius: 25px; border-bottom-right-radius: 25px;
                    position: sticky; top: 0; z-index: 100; box-shadow: 0 5px 15px rgba(99, 102, 241, 0.15);
                }
                .header-content { display: flex; justify-content: space-between; align-items: center; max-width: 500px; margin: 0 auto; gap: 8px; }

                .avatar-frame {
                    width: 36px; height: 36px; border-radius: 12px;
                    background: rgba(255,255,255,0.2); border: 1.5px solid rgba(255,255,255,0.4);
                    backdrop-filter: blur(10px); overflow: hidden; display: flex; justify-content: center; align-items: center; flex-shrink: 0; cursor: pointer;
                    transition: transform 0.3s ease;
                }
                .avatar-frame:active { transform: scale(0.9); }
                .avatar-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }

                .header-lang-switch { display: flex; background: rgba(0,0,0,0.1); padding: 3px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); }
                .h-lang-btn { padding: 4px 8px; font-size: 0.55rem; font-weight: 800; border-radius: 8px; cursor: pointer; transition: 0.3s; color: rgba(255,255,255,0.6); }
                .h-lang-btn.active { background: white; color: #6366f1; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

                .wallet-pill { background: rgba(255,255,255,0.15); backdrop-filter: blur(15px); padding: 5px 10px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.25); text-align: right; }
                .wallet-pill span { font-size: 0.45rem; text-transform: uppercase; font-weight: 800; opacity: 0.8; display: block; line-height: 1; }
                .wallet-pill b { display: block; font-size: 0.95rem; font-weight: 800; line-height: 1.2; }

                /* Animations */
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-6px); }
                    40%, 80% { transform: translateX(6px); }
                }
                .shake-animation { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

                .container { padding: 0 18px; max-width: 480px; margin: 20px auto 0; }
                .section-h { font-size: 1rem; font-weight: 800; margin: 0 0 15px 5px; color: #1e293b; animation: fadeUp 0.5s ease forwards; }
                
                .elite-card { 
                    background: white; border-radius: 22px; padding: 20px; 
                    border: 1px solid #e2e8f0; box-shadow: 0 8px 20px rgba(0,0,0,0.02);
                    animation: fadeUp 0.6s ease forwards; opacity: 0; animation-delay: 0.1s;
                }
                
                .input-group { margin-bottom: 14px; }
                .input-group label { display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-p); margin-bottom: 5px; margin-left: 5px; transition: color 0.3s; }
                .input-group input, .input-group select { 
                    width: 100%; padding: 12px 18px; background: #f8fafc; 
                    border: 2px solid transparent; border-radius: 15px; 
                    outline: none; transition: all 0.3s ease; font-size: 0.9rem; 
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
                }
                .input-group input:focus, .input-group select:focus {
                    background: white; border-color: rgba(99, 102, 241, 0.4);
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }
                .input-group:focus-within label { color: #6366f1; }
                
                .btn-elite { 
                    width: 100%; padding: 14px; border: none; border-radius: 16px; 
                    background: var(--p-gradient); color: white; font-size: 0.9rem; 
                    font-weight: 700; cursor: pointer; box-shadow: var(--p-glow); 
                    display: flex; align-items: center; justify-content: center; 
                    transition: all 0.2s ease; position: relative; z-index: 10;
                }
                .btn-elite:active { transform: scale(0.96); box-shadow: 0 0 10px rgba(99, 102, 241, 0.2); }
                .btn-elite:disabled { opacity: 0.7; cursor: not-allowed; transform: scale(1); box-shadow: none; }

                .spinner {
                    display: inline-block; width: 18px; height: 18px;
                    border: 2.5px solid rgba(255,255,255,0.3); border-radius: 50%;
                    border-top-color: #fff; animation: spin 0.8s linear infinite;
                    margin-right: 8px;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                /* Navigation */
                .nav-bar-container {
                    position: fixed; bottom: 15px; left: 15px; right: 15px;
                    z-index: 1000; display: flex; flex-direction: column; gap: 10px;
                    pointer-events: none;
                }
                .expanded-menu {
                    background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);
                    border-radius: 20px; padding: 12px; display: flex; gap: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #fff;
                    opacity: 0; transform: translateY(20px); pointer-events: none;
                    transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .nav-bar-container.open .expanded-menu { opacity: 1; transform: translateY(0); pointer-events: auto; }
                
                .nav-bar {
                    height: 65px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
                    border-radius: 20px; display: flex; align-items: center; justify-content: space-around;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #fff;
                    pointer-events: auto;
                }
                .nav-item { display: flex; flex-direction: column; align-items: center; color: #94a3b8; cursor: pointer; text-decoration: none; transition: 0.3s; }
                .nav-item:active { transform: scale(0.9); }
                .nav-item.active { color: #6366f1; }
                .nav-item i { font-size: 1.2rem; margin-bottom: 1px; font-style: normal; }
                .nav-item span { font-size: 0.5rem; font-weight: 700; }
                
                .cost-box {
                    background:#f0fdf4; padding:15px; border-radius:15px; margin-bottom:15px; 
                    text-align:center; border: 1px dashed #10b981; transition: 0.3s;
                }
                .cost-box:hover { background: #dcfce7; transform: translateY(-2px); }

                /* Message Box */
                .msg-box {
                    font-size: 0.8rem; font-weight: 800; text-align: center; margin-bottom: 15px; 
                    padding: 10px; border-radius: 12px; transition: 0.3s;
                }
                .msg-success { color: #166534; background: #dcfce7; border: 1px solid #86efac; }
                .msg-error { color: #e11d48; background: #ffe4e6; border: 1px solid #fda4af; }
            `}</style>

            <div className="header">
                <div className="header-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar-frame" onClick={() => router.push('/profile')}>
                            <img src={userData.avatar} onError={(e) => {e.target.src="https://cdn-icons-png.flaticon.com/512/149/149071.png"}} alt="Avatar"/>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '0.75rem', fontWeight: 800 }}>{userData.name}</h2>
                            <span style={{ fontSize: '0.45rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '6px' }}>PRO</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="header-lang-switch">
                            <div className={`h-lang-btn ${currentLang === 'bn' ? 'active' : ''}`} onClick={() => changeLang('bn')}>BN</div>
                            <div className={`h-lang-btn ${currentLang === 'en' ? 'active' : ''}`} onClick={() => changeLang('en')}>EN</div>
                        </div>
                        <div className="wallet-pill">
                            <span>{t.points}</span>
                            <b>{userData.points.toLocaleString()}</b>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <h3 className="section-h">{t.title}</h3>
                <div className="elite-card">
                    <div className="input-group">
                        <label>{t.cat}</label>
                        <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                            <option value="YouTube Subscribe">YouTube Subscribe (5 pts)</option>
                            <option value="Facebook Like">Facebook Like (3 pts)</option>
                            <option value="Telegram Join">Telegram Join (4 pts)</option>
                            <option value="App Install">App Download (10 pts)</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>{t.itemTitle}</label>
                        <input 
                            type="text" 
                            placeholder={currentLang === 'bn' ? "যেমন: আমার চ্যানেলটি সাবস্ক্রাইব করুন" : "e.g. Please subscribe my channel"} 
                            value={orderTitle}
                            onChange={(e) => setOrderTitle(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label>{t.url}</label>
                        <input 
                            type="url" 
                            placeholder="https://youtube.com/..." 
                            value={orderLink}
                            onChange={(e) => setOrderLink(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label>{t.qty}</label>
                        <input 
                            type="number" 
                            placeholder="10" 
                            value={orderQty}
                            onChange={(e) => setOrderQty(e.target.value)}
                        />
                    </div>

                    <div className="cost-box">
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>
                            <span>{t.totalCost}</span>: <b style={{ fontSize: '1.1rem', color: '#10b981' }}>{totalCost.toLocaleString()}</b>
                        </p>
                    </div>

                    {/* Message Box with Shake Animation */}
                    {message.visible && (
                        <div key={message.shakeKey} className={`msg-box ${message.isSuccess ? 'msg-success' : 'msg-error shake-animation'}`}>
                            {message.text}
                        </div>
                    )}

                    <button className="btn-elite" onClick={placeOrder} disabled={isLoading}>
                        {isLoading ? (
                            <><span className="spinner"></span> {t.processing}</>
                        ) : (
                            t.btnSubmit
                        )}
                    </button>
                </div>
            </div>

            {/* Navigation Bar */}
            <div className={`nav-bar-container ${navOpen ? 'open' : ''}`}>
                <div className="expanded-menu">
                    <div onClick={() => router.push('/leaderboard')} className="nav-item">
                        <i style={{ background: '#fdf2f8', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>🏆</i>
                        <span style={{ fontSize: '0.6rem' }}>Leaderboard</span>
                    </div>

                    <div onClick={() => router.push('/complaint')} className="nav-item">
                        <i style={{ background: '#f1f5f9', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>🛠️</i>
                        <span style={{ fontSize: '0.6rem' }}>Support</span>
                    </div>
                </div>

                <div className="nav-bar">
                    <div className="nav-item" onClick={() => router.push('/')}><i>🏠</i><span>{t.navMissions}</span></div>
                    <div className="nav-item active"><i>🚀</i><span>{t.navPromote}</span></div>
                    <div className="nav-item" onClick={() => router.push('/profile')}><i>👤</i><span>{t.navProfile}</span></div>
                    <div className="nav-item" onClick={() => setNavOpen(!navOpen)}>
                        <i style={{ transition: '0.3s', fontStyle: 'normal', fontSize: '1.3rem', transform: navOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</i>
                        <span>Menu</span>
                    </div>
                </div>
            </div>
        </>
    );
}
