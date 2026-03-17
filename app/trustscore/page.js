// File Path: app/trustscore/page.js

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, set, query, orderByChild, limitToLast } from 'firebase/database';

// Import Header and Footer from headfoot.js
import { Header, Footer } from '../../components/headfoot';

// Firebase Config
let firebaseConfig = {};
try {
    firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
} catch (error) {
    console.error("Firebase config parse error:", error);
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app); 
const appId = firebaseConfig.projectId; 

const zones = [
    { id: "green", max: 100, min: 81, name: "সবুজ জোন", status: "সেরা ইউজার", 
      color: "#10b981", bgColor: "#ecfdf5", msgColor: "#065f46", 
      message: "✅ <b>খুব ভালো!</b> আপনি আমাদের বিশ্বস্ত ইউজার। আপনার সব সুবিধা খোলা আছে এবং আপনার অ্যাড অগ্রাধিকার পাবে।" },
    { id: "white", max: 80, min: 61, name: "সাদা জোন", status: "সাধারণ ইউজার", 
      color: "#64748b", bgColor: "#f8fafc", msgColor: "#334155", 
      message: "ℹ️ আপনি সাধারণ নিয়মে আছেন। সঠিক কাজ করে সবুজ জোনে যাওয়ার চেষ্টা করুন, যাতে আপনার অ্যাড বেশি মানুষের কাছে পৌঁছায়।" },
    { id: "yellow", max: 60, min: 41, name: "হলুদ জোন", status: "সতর্ক ইউজার", 
      color: "#f59e0b", bgColor: "#fffbeb", msgColor: "#92400e", 
      message: "⚠️ <b>সতর্কতা!</b> স্কোরের কারণে <b>আপনার নতুন অ্যাড দেওয়া বন্ধ আছে।</b> নিয়ম মেনে কাজ করে পয়েন্ট বাড়ালে আবার সুবিধা পাবেন।" },
    { id: "black", max: 40, min: 21, name: "কালো জোন", status: "নজরদারিতে আছেন", 
      color: "#1e293b", bgColor: "#f1f5f9", msgColor: "#0f172a", 
      message: "👁️ <b>নজরদারি!</b> আপনি অ্যাডমিনের বিশেষ নজরে আছেন। আপনার সব কাজ গভীরভাবে চেক করা হচ্ছে। ভুল করলে সাসপেন্ড হবেন।" },
    { id: "red", max: 20, min: 0, name: "লাল জোন", status: "বিপদজনক", 
      color: "#f43f5e", bgColor: "#fff1f2", msgColor: "#9f1239", 
      message: "🚫 <b>বিপদ!</b> আপনার স্কোর তলানিতে। <b>কাজের লিস্ট বন্ধ</b> করা হয়েছে। আপনার আইডিটি বাতিলের পর্যায়ে আছে।" }
];

export default function TrustScorePage() {
    const router = useRouter();

    // Core States
    const [user, setUser] = useState(null);
    const [targetScore, setTargetScore] = useState(null);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [userLevel, setUserLevel] = useState(1);
    const [history, setHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // Header & Footer States
    const [userData, setUserData] = useState({ name: 'ইউজার', avatar: '', points: 0 });
    const [hasNewNotif, setHasNewNotif] = useState(false);
    const [currentLang, setCurrentLang] = useState('bn');
    const [navOpen, setNavOpen] = useState(false);
    const [view, setView] = useState('list-view');

    // Header & Footer Actions
    const changeLang = (lang) => setCurrentLang(lang);
    const openNotifications = () => console.log("Open Notifications");
    const handleSetView = (newView) => setView(newView);
    const toggleMenu = () => setNavOpen(!navOpen);

    // Translations for Header/Footer
    const t = {
        points: currentLang === 'bn' ? 'পয়েন্ট' : 'Points',
        navMissions: currentLang === 'bn' ? 'মিশন' : 'Missions',
        navPromote: currentLang === 'bn' ? 'প্রমোট' : 'Promote',
        navProfile: currentLang === 'bn' ? 'প্রোফাইল' : 'Profile'
    };

    // Fetch Data from Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && appId) { 
                setUser(currentUser);

                // Fetch User Profile (for Header)
                const profileRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/profile`);
                onValue(profileRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setUserData({
                            name: snapshot.val().name || currentUser.displayName || 'ইউজার',
                            avatar: snapshot.val().avatar || currentUser.photoURL || '',
                            points: snapshot.val().points || 0
                        });
                    } else {
                        setUserData({ name: currentUser.displayName || 'ইউজার', avatar: currentUser.photoURL || '', points: 0 });
                    }
                });

                // Fetch Trust Score
                const scoreRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/stats/trustScore`);
                onValue(scoreRef, (snapshot) => {
                    let score = snapshot.val();
                    if (score === null) {
                        score = 100;
                        set(scoreRef, 100);
                    }
                    setTargetScore(score);
                });

                // Fetch Level
                const levelRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/stats/userLevel`);
                onValue(levelRef, (snapshot) => {
                    let level = snapshot.val();
                    if (level === null) {
                        level = 1;
                        set(levelRef, 1);
                    }
                    setUserLevel(level);
                });

                // Fetch History
                const historyRef = query(ref(db, `artifacts/${appId}/users/${currentUser.uid}/trustHistory`), orderByChild('timestamp'), limitToLast(10));
                onValue(historyRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        const historyList = Object.keys(data).map(key => data[key]).sort((a, b) => b.timestamp - a.timestamp);
                        setHistory(historyList);
                    } else {
                        setHistory([]);
                    }
                    setIsLoadingHistory(false);
                });

            } else {
                // Guest/Demo Mode
                setUserData({ name: 'গেস্ট ইউজার', avatar: '', points: 150 });
                let localScore = localStorage.getItem('guest_trust_score') || 100;
                setTargetScore(parseInt(localScore));

                let localLevel = localStorage.getItem('guest_user_level') || 1;
                setUserLevel(parseInt(localLevel));

                // Demo History
                setHistory([
                    { type: 'decrease', reason: 'ভুল সিক্রেট কোড সাবমিট করা', points: 10, timestamp: Date.now() - 3600000 },
                    { type: 'increase', reason: 'সফলভাবে মিশন সম্পন্ন করা', points: 2, timestamp: Date.now() - 86400000 },
                    { type: 'decrease', reason: 'অ্যাডমিন কর্তৃক টাস্ক বাতিল', points: 25, timestamp: Date.now() - 172800000 }
                ]);
                setIsLoadingHistory(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Animate Score Counting
    useEffect(() => {
        if (targetScore === null) return;

        let current = 0;
        const boundedScore = Math.max(0, Math.min(100, targetScore));

        const interval = setInterval(() => {
            if (current >= boundedScore) {
                clearInterval(interval);
                setAnimatedScore(boundedScore);
            } else {
                current++;
                setAnimatedScore(current);
            }
        }, 15);

        return () => clearInterval(interval);
    }, [targetScore]);

    // Calculations
    const currentZone = zones.find(z => animatedScore >= z.min && animatedScore <= z.max) || zones[0];
    const circumference = 502.65;
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
    const nextZone = animatedScore < 81 ? zones.slice().reverse().find(z => z.min > animatedScore) : null;
    const pointsNeeded = nextZone ? nextZone.min - animatedScore : 0;

    const getLevelWidth = () => {
        if (userLevel >= 3) return '100%';
        if (userLevel === 2) return '50%';
        return '0%';
    };

    const getLevelIconStyle = (levelNum) => {
        if (userLevel >= levelNum) {
            return { background: '#3b82f6', boxShadow: '0 0 0 4px #eff6ff', color: 'white' };
        }
        return { background: '#cbd5e1', boxShadow: 'none', color: 'white' };
    };

    const getLevelTextStyle = (levelNum) => {
        return { color: userLevel >= levelNum ? '#3b82f6' : '#94a3b8' };
    };

    const formatDate = (timestamp) => {
        const dateObj = new Date(timestamp);
        return {
            dateStr: dateObj.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }),
            timeStr: dateObj.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
                
                body { 
                    margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; 
                    background: #f4f7fc; color: #0f172a; padding-bottom: 90px; min-height: 100vh;
                    -webkit-font-smoothing: antialiased;
                }
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                
                /* Animations */
                @keyframes slideUpFade { 0% { transform: translateY(40px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
                @keyframes pulseActive { 0% { box-shadow: 0 0 0 0 var(--pulse-color); } 70% { box-shadow: 0 0 20px 10px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
                @keyframes pulseWarning { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }

                /* Zone Cards */
                .zone-card {
                    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px);
                    padding: 20px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.9);
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.03); display: flex; gap: 18px; align-items: center;
                    opacity: 0; animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                .active-zone {
                    background: #ffffff; transform: scale(1.04); border-width: 2px;
                    box-shadow: 0 20px 40px -8px rgba(0,0,0,0.12); z-index: 10;
                }

                .icon-box {
                    width: 60px; height: 60px; border-radius: 20px; display: flex; justify-content: center; align-items: center; font-size: 28px; flex-shrink: 0; transition: 0.3s;
                }
                
                .progress-ring__circle {
                    transition: stroke-dashoffset 0.1s linear, stroke 0.5s ease;
                    transform: rotate(-90deg); transform-origin: 50% 50%;
                }

                /* History Timeline */
                .history-item {
                    position: relative; padding-left: 25px; margin-bottom: 20px;
                    opacity: 0; animation: slideUpFade 0.5s ease forwards;
                }
                .history-item::before {
                    content: ''; position: absolute; left: 0; top: 5px; width: 10px; height: 10px;
                    border-radius: 50%; z-index: 2; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .history-item:not(:last-child)::after {
                    content: ''; position: absolute; left: 4px; top: 15px; width: 2px; height: calc(100% + 5px);
                    background: #e2e8f0; z-index: 1;
                }
                .history-up::before { background: #10b981; }
                .history-down::before { background: #f43f5e; }
                
                .history-card {
                    background: white; padding: 15px; border-radius: 16px; border: 1px solid #f1f5f9;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02); display: flex; justify-content: space-between; align-items: center;
                }
                .h-time { font-size: 11px; color: #94a3b8; font-weight: 700; margin-bottom: 3px; display: block; }
                .h-reason { font-size: 13px; color: #334155; font-weight: 700; margin: 0; line-height: 1.4; }
                .h-score { font-size: 16px; font-weight: 800; padding: 4px 10px; border-radius: 10px; }
                .h-score.up { background: #ecfdf5; color: #059669; }
                .h-score.down { background: #fff1f2; color: #e11d48; }
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

            <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px' }}>

                {/* Page Title & Back Button */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', marginTop: '10px' }}>
                    <button onClick={() => router.back()} style={{ background: 'white', color: '#334155', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                        ❮ ব্যাক
                    </button>
                    <h2 style={{ margin: '0 0 0 15px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>ট্রাস্ট প্রোফাইল</h2>
                </div>

                {/* Main Dashboard Card */}
                <div style={{ 
                    background: '#ffffff', borderRadius: '35px', padding: '30px 20px 40px 20px', textAlign: 'center', 
                    boxShadow: `0 30px 60px -15px ${currentZone.color}40`, position: 'relative', 
                    zIndex: 10, border: `2px solid ${currentZone.color}30`, transition: 'all 0.5s ease' 
                }}>

                    {/* Level Progress Bar */}
                    <div style={{ background: '#f8fafc', padding: '15px 15px 25px 15px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#475569', fontWeight: 800, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' }}>ইউজার লেভেল</h4>

                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px', marginTop: '5px', zIndex: 1 }}>
                            <div style={{ position: 'absolute', top: '12px', left: '20px', right: '20px', height: '4px', background: '#e2e8f0', zIndex: -1, borderRadius: '2px' }}></div>
                            <div style={{ position: 'absolute', top: '12px', left: '20px', width: getLevelWidth(), height: '4px', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', zIndex: -1, borderRadius: '2px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>

                            {[
                                { num: 1, label: 'নতুন' },
                                { num: 2, label: 'জুনিয়র' },
                                { num: 3, label: 'প্রো' }
                            ].map(step => (
                                <div key={step.num} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', transition: '0.4s', ...getLevelIconStyle(step.num) }}>
                                        {step.num}
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 800, position: 'absolute', top: '35px', whiteSpace: 'nowrap', transition: '0.4s', ...getLevelTextStyle(step.num) }}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 800, marginBottom: '25px', textTransform: 'uppercase', letterSpacing: '2px' }}>বর্তমান রেটিং</p>

                    {/* SVG Donut Chart */}
                    <div style={{ position: 'relative', width: '190px', height: '190px', margin: '0 auto' }}>
                        <svg width="190" height="190" viewBox="0 0 190 190" style={{ filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.06))' }}>
                            <circle cx="95" cy="95" r="80" fill="none" stroke="#f1f5f9" strokeWidth="16"></circle>
                            <circle 
                                className="progress-ring__circle" 
                                cx="95" cy="95" r="80" fill="none" 
                                stroke={currentZone.color} 
                                strokeWidth="16" strokeLinecap="round" 
                                strokeDasharray="502.65" 
                                strokeDashoffset={strokeDashoffset}
                            ></circle>
                        </svg>

                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <h1 style={{ margin: 0, fontSize: '68px', fontWeight: 800, color: currentZone.color, lineHeight: 1, letterSpacing: '-2px' }}>{animatedScore}</h1>
                            <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 800, marginTop: '2px' }}>/ ১০০</span>
                        </div>
                    </div>

                    {/* Status Info */}
                    <div style={{ marginTop: '30px' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 800, color: currentZone.color }}>{currentZone.name}</h3>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: currentZone.color, backgroundColor: currentZone.bgColor, padding: '8px 20px', borderRadius: '50px', display: 'inline-block' }}>{currentZone.status}</span>
                    </div>

                    {/* Gamification Message */}
                    {nextZone && (
                        <div style={{ marginTop: '22px', fontSize: '14px', fontWeight: 800, color: '#4f46e5', background: '#eef2ff', padding: '12px', borderRadius: '16px', border: '1px dashed #c7d2fe' }}>
                            পরবর্তী জোনে যেতে আর <b>{pointsNeeded}</b> পয়েন্ট লাগবে! 🚀
                        </div>
                    )}

                    {/* Dynamic Action Message */}
                    <div dangerouslySetInnerHTML={{ __html: currentZone.message }} style={{ 
                        marginTop: '20px', padding: '18px', borderRadius: '22px', fontSize: '14px', fontWeight: 600, 
                        textAlign: 'left', lineHeight: 1.6, background: currentZone.bgColor, color: currentZone.msgColor, 
                        border: `1px solid ${currentZone.color}40`, transition: 'all 0.3s ease' 
                    }} />
                </div>

                {/* Warning Alert */}
                <div style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', padding: '22px', borderRadius: '26px', border: '1px solid #fecdd3', marginTop: '25px', boxShadow: '0 15px 30px -10px rgba(225, 29, 72, 0.15)', display: 'flex', gap: '16px', alignItems: 'flex-start', position: 'relative', overflow: 'hidden', animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                    <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '80px', opacity: 0.05, transform: 'rotate(15deg)' }}>⚠️</div>

                    <div style={{ background: '#e11d48', color: 'white', width: '42px', height: '42px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, boxShadow: '0 8px 15px rgba(225, 29, 72, 0.3)', animation: 'pulseWarning 2s infinite' }}>⚠️</div>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <h4 style={{ margin: '0 0 6px 0', color: '#9f1239', fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px' }}>জরুরী সতর্কবার্তা</h4>
                        <p style={{ margin: 0, fontSize: '13.5px', color: '#be123c', lineHeight: 1.6, fontWeight: 600 }}>
                            দয়া করে সৎভাবে কাজ করুন, তাহলে আমরাও চেষ্টা করব আপনাদের আরও বেশি সুবিধা দেওয়ার। কিন্তু কোনো প্রকার অসৎ উপায় অবলম্বন করলে আপনাকে ওয়েবসাইট থেকে সরাসরি <b>সাসপেন্ড</b> করা হবে।
                        </p>
                    </div>
                </div>

                {/* History Section */}
                <div style={{ marginTop: '40px', marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px', padding: '0 5px' }}>
                        <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '6px', borderRadius: '10px', fontSize: '16px' }}>⏱️</span> স্কোর হিস্ট্রি
                        </h3>
                    </div>

                    <div style={{ paddingLeft: '5px' }}>
                        {isLoadingHistory ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>লোড হচ্ছে...</div>
                        ) : history.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '25px 20px', background: 'white', borderRadius: '20px', border: '1px dashed #cbd5e1', color: '#94a3b8' }}>
                                <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📋</span>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>এখনো কোনো স্কোর পরিবর্তন হয়নি。<br/>নতুন অ্যাকাউন্ট হলে আপনার স্কোর ১০০ থেকে শুরু হবে।</p>
                            </div>
                        ) : (
                            <>
                                {history.map((item, index) => {
                                    const isUp = item.type === 'increase';
                                    const sign = isUp ? '+' : '-';
                                    const cssClass = isUp ? 'history-up' : 'history-down';
                                    const scoreClass = isUp ? 'up' : 'down';
                                    const { dateStr, timeStr } = formatDate(item.timestamp);

                                    return (
                                        <div key={index} className={`history-item ${cssClass}`} style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
                                            <div className="history-card">
                                                <div>
                                                    <span className="h-time">{dateStr}, {timeStr}</span>
                                                    <p className="h-reason">{item.reason}</p>
                                                </div>
                                                <div className={`h-score ${scoreClass}`}>
                                                    {sign}{item.points}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {!user && (
                                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, background: '#e2e8f0', padding: '4px 10px', borderRadius: '20px' }}>এটি ডেমো হিস্ট্রি। অরিজিনাল দেখতে লগইন করুন।</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Rules & Zones Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '40px 5px 25px 5px' }}>
                    <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '6px', borderRadius: '10px', fontSize: '16px' }}>📊</span> নিয়ম ও সুবিধা
                    </h3>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>*বর্তমান জোন হাইলাইট করা</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '30px' }}>
                    {zones.map((zone, index) => {
                        const isActive = currentZone.id === zone.id;
                        let icon = "🌟";
                        let bgGradient = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                        let desc = "";

                        if (zone.id === 'white') { icon = "👍"; bgGradient = "linear-gradient(135deg, #64748b 0%, #475569 100%)"; desc = "সব কাজ খোলা আছে। অ্যাড <b>নরমাল লিস্টে</b> থাকবে।"; }
                        if (zone.id === 'yellow') { icon = "⚠️"; bgGradient = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"; desc = "কাজ করতে পারবেন, কিন্তু আপনার <b>নতুন অ্যাড দেওয়া বন্ধ।</b>"; }
                        if (zone.id === 'black') { icon = "👁️"; bgGradient = "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"; desc = "অ্যাডমিনের নজরদারিতে আছেন। আপনার সব কাজ <b>চেক হবে</b>।"; }
                        if (zone.id === 'red') { icon = "🚫"; bgGradient = "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)"; desc = "<b>সব কাজ সম্পূর্ণ বন্ধ।</b> যেকোনো সময় আইডি বাতিল হতে পারে।"; }
                        if (zone.id === 'green') { desc = "সব কাজ করতে পারবেন। আপনার অ্যাড <b>সবার উপরে</b> থাকবে।"; }

                        return (
                            <div 
                                key={zone.id} 
                                className={`zone-card ${isActive ? 'active-zone' : ''}`} 
                                style={{ 
                                    animationDelay: `${(index + 1) * 0.1}s`,
                                    borderColor: isActive ? zone.color : 'rgba(255,255,255,0.9)',
                                    '--pulse-color': isActive ? `${zone.color}40` : 'transparent',
                                    animation: isActive ? 'slideUpFade 0.7s forwards, pulseActive 2s infinite' : 'slideUpFade 0.7s forwards'
                                }}
                            >
                                <div className="icon-box" style={{ background: bgGradient, boxShadow: `0 10px 20px ${zone.color}40` }}>{icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <h4 style={{ margin: 0, color: zone.msgColor, fontWeight: 800, fontSize: '17px' }}>{zone.name}</h4>
                                        <span style={{ fontSize: '12px', fontWeight: 800, background: zone.bgColor, color: zone.msgColor, padding: '4px 12px', borderRadius: '10px' }}>{zone.min}-{zone.max}</span>
                                    </div>
                                    <p dangerouslySetInnerHTML={{ __html: desc }} style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: 600, lineHeight: 1.5 }} />
                                </div>
                            </div>
                        );
                    })}
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

