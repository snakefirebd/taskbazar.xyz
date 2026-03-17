// File Path: app/order/page.js

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';

// Import Header and Footer from headfoot.js
import { Header, Footer } from '../../components/headfoot';

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
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu",
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
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu",
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
    
    // UI States
    const [navOpen, setNavOpen] = useState(false);
    const [view, setView] = useState('order-view'); // For footer active state (will default to Promote if matched in logic, here we just pass a string)
    const [hasNewNotif, setHasNewNotif] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", isSuccess: false, visible: false, shakeKey: 0 });

    // Form States
    const [orderType, setOrderType] = useState("YouTube Subscribe");
    const [orderTitle, setOrderTitle] = useState("");
    const [orderLink, setOrderLink] = useState("");
    const [orderQty, setOrderQty] = useState("");

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

    // Header & Footer Actions
    const changeLang = (lang) => {
        setCurrentLang(lang);
        localStorage.setItem('elite_lang', lang);
        setMessage({ ...message, visible: false }); // হাইড মেসেজ অন ল্যাং চেঞ্জ
    };
    
    const toggleMenu = () => setNavOpen(!navOpen);
    const handleSetView = (newView) => setView(newView);
    const openNotifications = () => {
        showMessage(currentLang === 'bn' ? "নোটিফিকেশন দেখতে হোম পেইজে যান।" : "Go to home page for notifications.", true);
        setTimeout(() => { router.push('/'); }, 1000);
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
            const response = await fetch('/api/create-campaign', {
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

            {/* --- IMPORTED HEADER --- */}
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

            {/* --- IMPORTED FOOTER --- */}
            <Footer 
                navOpen={navOpen} 
                setNavOpen={setNavOpen} 
                view={view} 
                handleSetView={handleSetView} 
                toggleMenu={toggleMenu} 
                t={t} 
                router={router} 
            />
        </>
    );
}

