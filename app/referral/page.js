// File Path: app/referral/page.js

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';

// Import Header and Footer from headfoot.js
import { Header, Footer } from '../../components/headfoot';

let firebaseConfig = {};
try {
    firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
} catch (error) {
    console.error("Firebase config parse error:", error);
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);
const appId = firebaseConfig.projectId;
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const translations = {
    bn: {
        points: "ব্যালেন্স",
        pageTitle: "রেফার ও ক্যাশব্যাক 💸",
        pageDesc: "বন্ধুদের ইনভাইট করুন এবং মাইলস্টোন পূরণ করে জিতে নিন বড় অংকের নগদ টাকা!",
        rewardText: "প্রতি রেফারে বোনাস ছাড়াও রয়েছে স্পেশাল ক্যাশ রিওয়ার্ড!",
        yourCodeText: "আপনার রেফারেল কোড",
        yourLinkText: "আপনার রেফারেল লিংক",
        copyBtn: "কোড কপি করুন",
        copyLinkBtn: "লিংক কপি করুন",
        shareBtn: "লিংক শেয়ার করুন",
        totalReferrals: "মোট রেফার",
        friendsJoined: "সফল রেফার",
        historyTitle: "রেফারেল হিস্ট্রি",
        noHistory: "আপনি এখনো কাউকে রেফার করেননি। বন্ধুদের ইনভাইট করে টাকা আয় শুরু করুন! 🚀",
        copiedToast: "রেফার কোড কপি করা হয়েছে! 📋",
        copiedLinkToast: "রেফার লিংক কপি করা হয়েছে! 🔗",
        shareNotSupported: "আপনার ব্রাউজার শেয়ার সাপোর্ট করে না।",
        joinedAt: "জয়েন:",
        nextReward: "পরবর্তী বোনাস",
        milestoneTitle: "আপনার রিওয়ার্ড মাইলস্টোন",
        step: "ধাপ",
        needMore: "আরো রেফার প্রয়োজন:",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu"
    },
    en: {
        points: "Balance",
        pageTitle: "Refer & Earn Cash 💸",
        pageDesc: "Invite friends and reach milestones to earn huge cash rewards!",
        rewardText: "Special cash rewards for reaching referral targets!",
        yourCodeText: "Your Referral Code",
        yourLinkText: "Your Referral Link",
        copyBtn: "Copy Code",
        copyLinkBtn: "Copy Link",
        shareBtn: "Share Link",
        totalReferrals: "Total Referrals",
        friendsJoined: "Success Referrals",
        historyTitle: "Referral History",
        noHistory: "You haven't referred anyone yet. Start inviting friends! 🚀",
        copiedToast: "Referral code copied! 📋",
        copiedLinkToast: "Referral link copied! 🔗",
        shareNotSupported: "Your browser doesn't support sharing.",
        joinedAt: "Joined:",
        nextReward: "Next Bonus",
        milestoneTitle: "Your Reward Milestones",
        step: "Step",
        needMore: "Refers needed:",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu"
    }
};

// মাইলস্টোন ডেটা (চাহিদা অনুযায়ী)
const referralMilestones = [
    { target: 1, reward: 2, label: "১ম ধাপ" },
    { target: 6, reward: 10, label: "২য় ধাপ" },
    { target: 16, reward: 20, label: "৩য় ধাপ" },
    { target: 46, reward: 100, label: "৪র্থ ধাপ" },
    { target: 96, reward: 500, label: "৫ম ধাপ" }
];

export default function ReferralPage() {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [origin, setOrigin] = useState('');
    const [userData, setUserData] = useState({ 
        balance: 0, 
        name: "Member", 
        avatar: defaultAvatar,
        referralCode: "------",
        totalReferrals: 0
    });
    const [referralHistory, setReferralHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [currentLang, setCurrentLang] = useState('bn');
    
    const [navOpen, setNavOpen] = useState(false);
    const [view, setView] = useState('referral-view'); 
    const [hasNewNotif, setHasNewNotif] = useState(false);
    const [toast, setToast] = useState({ msg: "", visible: false });

    const t = translations[currentLang];

    useEffect(() => {
        setOrigin(window.location.origin);
        const savedLang = localStorage.getItem('elite_lang') || 'bn';
        setCurrentLang(savedLang);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && appId) {
                setUser(currentUser);

                const statsRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/stats`);
                onValue(statsRef, (snap) => {
                    const d = snap.val() || {};
                    setUserData({
                        balance: d.balance || 0, // points এর বদলে balance
                        name: d.name || "Member",
                        avatar: (d.avatar && d.avatar !== "null") ? d.avatar : defaultAvatar,
                        referralCode: d.referralCode || "------",
                        totalReferrals: d.totalReferrals || 0
                    });
                });

                const refsRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/referrals`);
                onValue(refsRef, (snap) => {
                    const data = snap.val();
                    if (data) {
                        const historyArray = Object.keys(data).map(key => ({
                            id: key,
                            ...data[key]
                        })).sort((a, b) => b.timestamp - a.timestamp);
                        setReferralHistory(historyArray);
                    } else {
                        setReferralHistory([]);
                    }
                    setIsLoadingHistory(false);
                });

            } else if (!currentUser) {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const referralLink = userData.referralCode !== "------" ? `${origin}/register?ref=${userData.referralCode}` : "Generating...";

    // পরবর্তী মাইলস্টোন ক্যালকুলেশন
    const nextMilestone = referralMilestones.find(m => userData.totalReferrals < m.target) || null;
    const currentProgress = nextMilestone 
        ? (userData.totalReferrals / nextMilestone.target) * 100 
        : 100;

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast({ msg: "", visible: false }), 3000);
    };

    const handleCopy = (textToCopy, type) => {
        if (textToCopy && textToCopy !== "------" && textToCopy !== "Generating...") {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(type === 'link' ? t.copiedLinkToast : t.copiedToast);
            });
        }
    };

    const handleShare = async () => {
        const shareText = currentLang === 'bn' 
            ? `টাস্ক বাজার-এ আমার কোড ${userData.referralCode} ব্যবহার করে জয়েন করুন এবং ক্যাশ মাইলস্টোন রিওয়ার্ড জিতে নিন! \n${referralLink}` 
            : `Join TaskBazar using my code ${userData.referralCode} and win cash rewards! \n${referralLink}`;
            
        if (navigator.share) {
            try {
                await navigator.share({ title: 'TaskBazar Cash Referral', text: shareText, url: referralLink });
            } catch (error) { console.log(error); }
        } else { showToast(t.shareNotSupported); }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
                
                :root {
                    --primary: #2563eb;
                    --p-gradient: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
                    --gold: #f59e0b;
                    --bg: #f1f5f9;
                }

                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent;}
                body { background: var(--bg); color: #0f172a; padding-bottom: 120px; }

                .container { padding: 0 18px; max-width: 480px; margin: 20px auto 0; }
                
                /* Progress Milestone Box */
                .milestone-card {
                    background: white; border-radius: 24px; padding: 20px; margin-bottom: 20px;
                    border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    position: relative; overflow: hidden;
                }
                .milestone-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
                .milestone-title { font-size: 0.85rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
                .reward-badge { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 800; }
                
                .progress-info { margin-top: 15px; }
                .progress-text { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; margin-bottom: 8px; color: #1e293b; }
                .progress-bar-bg { height: 10px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
                .progress-bar-fill { height: 100%; background: var(--p-gradient); border-radius: 10px; transition: 1s cubic-bezier(0.4, 0, 0.2, 1); }

                /* Milestone Steps Table */
                .steps-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 8px; margin-top: 20px; }
                .step-item {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 12px 15px; background: #f8fafc; border-radius: 15px; border: 1px solid #e2e8f0;
                }
                .step-item.active { border-color: var(--gold); background: #fffcf0; }
                .step-label { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; font-weight: 700; }
                .step-dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; }
                .step-item.completed .step-dot { background: #10b981; }
                .step-item.active .step-dot { background: var(--gold); }
                .step-reward { font-size: 0.85rem; font-weight: 800; color: #1e293b; }

                /* Banner */
                .referral-banner {
                    background: linear-gradient(145deg, #2563eb 0%, #1e40af 100%);
                    border-radius: 24px; padding: 25px 20px; text-align: center; color: white;
                    box-shadow: 0 10px 30px rgba(37, 99, 235, 0.2); margin-bottom: 20px;
                }
                .banner-title { font-size: 1.3rem; font-weight: 800; margin-bottom: 8px; }
                .banner-desc { font-size: 0.8rem; opacity: 0.9; font-weight: 500; }

                /* Code Card */
                .code-card {
                    background: white; border-radius: 24px; padding: 20px; margin-bottom: 20px;
                    border: 1px solid #e2e8f0;
                }
                .code-box {
                    background: #f8fafc; border: 2px dashed #cbd5e1; padding: 15px; border-radius: 16px;
                    font-size: 1.6rem; font-weight: 800; color: var(--primary); letter-spacing: 3px; margin: 10px 0;
                    text-align: center;
                }
                .action-btns { display: flex; gap: 8px; margin-top: 15px; }
                .btn { flex: 1; padding: 12px; border-radius: 14px; font-weight: 800; font-size: 0.8rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
                .btn-p { background: var(--p-gradient); color: white; }
                .btn-s { background: #10b981; color: white; }
                
                .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
                .stat-card { background: white; padding: 15px; border-radius: 20px; text-align: center; border: 1px solid #e2e8f0; }
                .stat-card p { font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; }
                .stat-card h3 { font-size: 1.3rem; font-weight: 800; color: #0f172a; }

                #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 10px 20px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; z-index: 9999; }
            `}</style>

            {toast.visible && <div id="toast">{toast.msg}</div>}

            <Header 
                user={user} userData={{...userData, points: userData.balance}} 
                hasNewNotif={hasNewNotif} openNotifications={() => router.push('/')} 
                currentLang={currentLang} changeLang={(l) => setCurrentLang(l)} 
                t={t} router={router} 
            />

            <div className="container">
                
                <div className="referral-banner">
                    <h2 className="banner-title">{t.pageTitle}</h2>
                    <p className="banner-desc">{t.pageDesc}</p>
                </div>

                {/* Milestone Section */}
                <div className="milestone-card">
                    <div className="milestone-header">
                        <span className="milestone-title">{t.milestoneTitle}</span>
                        {nextMilestone && (
                            <div className="reward-badge">+{nextMilestone.reward} ৳ Bonus</div>
                        )}
                    </div>

                    <div className="progress-info">
                        <div className="progress-text">
                            <span>{nextMilestone ? `${t.step}: ${nextMilestone.label}` : "All Cleared!"}</span>
                            <span>{userData.totalReferrals} / {nextMilestone ? nextMilestone.target : userData.totalReferrals}</span>
                        </div>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${currentProgress}%` }}></div>
                        </div>
                        {nextMilestone && (
                            <p style={{fontSize: '0.65rem', marginTop: '8px', color: '#64748b', fontWeight: 700}}>
                                🎁 {t.needMore} {nextMilestone.target - userData.totalReferrals}
                            </p>
                        )}
                    </div>

                    <div className="steps-grid">
                        {referralMilestones.map((m, idx) => {
                            const isCompleted = userData.totalReferrals >= m.target;
                            const isActive = !isCompleted && (idx === 0 || userData.totalReferrals >= referralMilestones[idx-1].target);
                            return (
                                <div key={idx} className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                                    <div className="step-label">
                                        <div className="step-dot"></div>
                                        <span>{m.target} Refers</span>
                                    </div>
                                    <div className="step-reward" style={{color: isCompleted ? '#10b981' : '#1e293b'}}>
                                        {isCompleted ? "✅ " : ""}{m.reward} ৳
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="stat-grid">
                    <div className="stat-card">
                        <p>{t.friendsJoined}</p>
                        <h3>{userData.totalReferrals}</h3>
                    </div>
                    <div className="stat-card">
                        <p>{t.points}</p>
                        <h3 style={{color: '#10b981'}}>{userData.balance} ৳</h3>
                    </div>
                </div>

                <div className="code-card">
                    <p style={{textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8'}}>{t.yourCodeText}</p>
                    <div className="code-box">{userData.referralCode}</div>
                    <button className="btn" style={{background: '#f1f5f9', color: '#475569', width: '100%'}} onClick={() => handleCopy(userData.referralCode, 'code')}>
                        📋 {t.copyBtn}
                    </button>
                    
                    <div style={{height: '1px', background: '#e2e8f0', margin: '20px 0'}}></div>
                    
                    <p style={{textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8'}}>{t.yourLinkText}</p>
                    <div className="action-btns">
                        <button className="btn btn-p" onClick={() => handleCopy(referralLink, 'link')}>🔗 Link</button>
                        <button className="btn btn-s" onClick={handleShare}>🚀 Share</button>
                    </div>
                </div>

                {/* History */}
                <div style={{marginTop: '30px'}}>
                    <h3 style={{fontSize: '0.95rem', fontWeight: 800, marginBottom: '15px'}}>{t.historyTitle}</h3>
                    {referralHistory.length === 0 ? (
                        <div style={{textAlign: 'center', padding: '30px', background: 'white', borderRadius: '20px', border: '1px dashed #cbd5e1'}}>
                            <p style={{fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600}}>{t.noHistory}</p>
                        </div>
                    ) : (
                        referralHistory.map((item) => (
                            <div key={item.id} style={{background: 'white', padding: '12px 15px', borderRadius: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0'}}>
                                <div>
                                    <h4 style={{fontSize: '0.8rem', fontWeight: 800}}>{item.userName || "User"}</h4>
                                    <p style={{fontSize: '0.65rem', color: '#64748b'}}>{new Date(item.timestamp).toLocaleDateString()}</p>
                                </div>
                                <span style={{fontSize: '0.65rem', fontWeight: 800, color: '#10b981', background: '#dcfce7', padding: '4px 10px', borderRadius: '8px'}}>Verified</span>
                            </div>
                        ))
                    )}
                </div>

            </div>

            <Footer navOpen={navOpen} setNavOpen={setNavOpen} view={view} handleSetView={setView} toggleMenu={() => setNavOpen(!navOpen)} t={t} router={router} />
        </>
    );
}

