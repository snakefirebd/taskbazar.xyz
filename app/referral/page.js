// File Path: app/referral/page.js "important message for gemini ai"

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

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app); // Realtime Database ব্যবহার করা হচ্ছে
const appId = firebaseConfig.projectId; // JSON থেকে projectId নেওয়া হলো
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const translations = {
    bn: {
        points: "পয়েন্ট",
        pageTitle: "রেফার ও আয় 🎁",
        pageDesc: "আপনার বন্ধুদের ইনভাইট করুন এবং প্রতি সফল রেফারে আকর্ষণীয় পয়েন্ট জিতে নিন!",
        rewardText: "আপনি পাবেন ১০০ পয়েন্ট, আপনার বন্ধু পাবে ৫০ পয়েন্ট!",
        yourCodeText: "আপনার রেফারেল কোড",
        yourLinkText: "আপনার রেফারেল লিংক",
        copyBtn: "কোড কপি করুন",
        copyLinkBtn: "লিংক কপি করুন",
        shareBtn: "লিংক শেয়ার করুন",
        totalReferrals: "মোট রেফার",
        friendsJoined: "বন্ধুরা জয়েন করেছে",
        historyTitle: "যাদের রেফার করেছেন",
        noHistory: "আপনি এখনো কাউকে রেফার করেননি। বন্ধুদের ইনভাইট করা শুরু করুন! 🚀",
        copiedToast: "রেফার কোড কপি করা হয়েছে! 📋",
        copiedLinkToast: "রেফার লিংক কপি করা হয়েছে! 🔗",
        shareNotSupported: "আপনার ব্রাউজার শেয়ার সাপোর্ট করে না।",
        joinedAt: "জয়েন:",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu"
    },
    en: {
        points: "Points",
        pageTitle: "Refer & Earn 🎁",
        pageDesc: "Invite your friends and earn exciting points for every successful referral!",
        rewardText: "You get 100 points, your friend gets 50 points!",
        yourCodeText: "Your Referral Code",
        yourLinkText: "Your Referral Link",
        copyBtn: "Copy Code",
        copyLinkBtn: "Copy Link",
        shareBtn: "Share Link",
        totalReferrals: "Total Referrals",
        friendsJoined: "Friends Joined",
        historyTitle: "Referred Friends",
        noHistory: "You haven't referred anyone yet. Start inviting friends! 🚀",
        copiedToast: "Referral code copied! 📋",
        copiedLinkToast: "Referral link copied! 🔗",
        shareNotSupported: "Your browser doesn't support sharing.",
        joinedAt: "Joined:",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu"
    }
};

export default function ReferralPage() {
    const router = useRouter();

    // User & Global States
    const [user, setUser] = useState(null);
    const [origin, setOrigin] = useState('');
    const [userData, setUserData] = useState({ 
        points: 0, 
        name: "Member", 
        avatar: defaultAvatar,
        referralCode: "------",
        totalReferrals: 0
    });
    const [referralHistory, setReferralHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [currentLang, setCurrentLang] = useState('bn');
    
    // UI States
    const [navOpen, setNavOpen] = useState(false);
    const [view, setView] = useState('referral-view'); 
    const [hasNewNotif, setHasNewNotif] = useState(false);
    const [toast, setToast] = useState({ msg: "", visible: false });

    const t = translations[currentLang];

    // Initialize & Fetch Auth Data
    useEffect(() => {
        setOrigin(window.location.origin);
        const savedLang = localStorage.getItem('elite_lang') || 'bn';
        setCurrentLang(savedLang);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && appId) {
                setUser(currentUser);

                // Fetch User Stats
                const statsRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/stats`);
                onValue(statsRef, (snap) => {
                    const d = snap.val() || {};
                    setUserData({
                        points: d.points || 0,
                        name: d.name || "Member",
                        avatar: (d.avatar && d.avatar !== "null" && d.avatar !== "undefined") ? d.avatar : defaultAvatar,
                        referralCode: d.referralCode || "------",
                        totalReferrals: d.totalReferrals || 0
                    });
                });

                // Fetch Referral History
                const refsRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/referrals`);
                onValue(refsRef, (snap) => {
                    const data = snap.val();
                    if (data) {
                        const historyArray = Object.keys(data).map(key => ({
                            id: key,
                            ...data[key]
                        })).sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
                        
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

    // Referral Link Generation
    const referralLink = userData.referralCode !== "------" ? `${origin}/register?ref=${userData.referralCode}` : "Generating link...";

    // UI Actions
    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast({ msg: "", visible: false }), 3000);
    };

    const changeLang = (lang) => {
        setCurrentLang(lang);
        localStorage.setItem('elite_lang', lang);
    };

    const toggleMenu = () => setNavOpen(!navOpen);
    const handleSetView = (newView) => setView(newView);

    const openNotifications = () => {
        showToast(currentLang === 'bn' ? "নোটিফিকেশন দেখতে হোম পেইজে যান।" : "Go to home page for notifications.");
        setTimeout(() => { router.push('/'); }, 1000);
    };

    // Action Handlers
    const handleCopy = (textToCopy, type) => {
        if (textToCopy && textToCopy !== "------" && textToCopy !== "Generating link...") {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(type === 'link' ? t.copiedLinkToast : t.copiedToast);
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    showToast(type === 'link' ? t.copiedLinkToast : t.copiedToast);
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                }
                document.body.removeChild(textArea);
            });
        }
    };

    const handleShare = async () => {
        const shareText = currentLang === 'bn' 
            ? `টাস্ক বাজার-এ জয়েন করুন এবং আয় করুন! আমার রেফার লিংকটি ব্যবহার করুন: \n${referralLink}` 
            : `Join TaskBazar and start earning! Use my referral link: \n${referralLink}`;
            
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'TaskBazar Referral',
                    text: shareText,
                    url: referralLink,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            showToast(t.shareNotSupported);
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
                }

                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent;}
                body { background: var(--bg); color: var(--text-h); line-height: 1.6; padding-bottom: 120px; }

                .container { padding: 0 18px; max-width: 480px; margin: 20px auto 0; }
                
                /* Animations */
                @keyframes slideUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                
                /* Banner */
                .referral-banner {
                    background: linear-gradient(145deg, #ffffff 0%, #f3e8ff 100%);
                    border-radius: 22px; padding: 25px 20px; text-align: center;
                    border: 1px dashed #a855f7; box-shadow: 0 8px 25px rgba(168, 85, 247, 0.08);
                    animation: scaleIn 0.4s ease-out; margin-bottom: 20px;
                }
                .banner-icon { font-size: 3rem; margin-bottom: 10px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
                .banner-title { font-size: 1.2rem; font-weight: 800; color: #4c1d95; margin-bottom: 8px; }
                .banner-desc { font-size: 0.8rem; color: #64748b; font-weight: 600; line-height: 1.5; padding: 0 10px; }

                /* Reward Box */
                .reward-pill {
                    background: #fef3c7;
                    color: #d97706;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 800;
                    display: inline-block;
                    margin-top: 15px;
                    border: 1px dashed #f59e0b;
                    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.1);
                }

                /* Code & Link Card */
                .code-card {
                    background: white; border-radius: 20px; padding: 20px; margin-bottom: 20px;
                    border: 1px solid #e2e8f0; box-shadow: 0 8px 20px rgba(0,0,0,0.02);
                    text-align: center; animation: slideUp 0.4s ease-out; animation-delay: 0.1s; opacity: 0; animation-fill-mode: forwards;
                }
                .code-label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
                
                .code-box {
                    background: #f8fafc; border: 2px dashed #cbd5e1; padding: 15px; border-radius: 16px;
                    font-size: 1.8rem; font-weight: 800; color: #6366f1; letter-spacing: 4px; margin-bottom: 15px;
                }
                
                .link-box {
                    background: #f8fafc; border: 2px dashed #cbd5e1; padding: 12px 15px; border-radius: 16px;
                    font-size: 0.85rem; font-weight: 600; color: #6366f1; margin-bottom: 15px;
                    word-break: break-all;
                }

                .divider { height: 1px; background: #e2e8f0; margin: 20px 0; width: 100%; }

                .action-buttons { display: flex; gap: 10px; }
                .btn-action {
                    flex: 1; padding: 12px; border-radius: 14px; font-weight: 800; font-size: 0.85rem; border: none; cursor: pointer; transition: 0.2s;
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                }
                .btn-copy { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
                .btn-copy-main { background: var(--p-gradient); color: white; box-shadow: var(--p-glow); }
                .btn-share { background: #10b981; color: white; box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
                .btn-action:active { transform: scale(0.96); }

                /* Stats */
                .stats-container { display: flex; gap: 12px; margin-bottom: 25px; animation: slideUp 0.4s ease-out; animation-delay: 0.2s; opacity: 0; animation-fill-mode: forwards; }
                .stat-box {
                    flex: 1; background: white; padding: 15px; border-radius: 18px; text-align: center;
                    border: 1px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.02);
                }
                .stat-box span { display: block; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
                .stat-box b { display: block; font-size: 1.4rem; font-weight: 800; color: #10b981; }

                /* History List */
                .history-section { animation: slideUp 0.4s ease-out; animation-delay: 0.3s; opacity: 0; animation-fill-mode: forwards; }
                .history-title { font-size: 0.95rem; font-weight: 800; color: #1e293b; margin-bottom: 12px; margin-left: 5px; }
                .ref-item {
                    background: white; padding: 15px; border-radius: 16px; margin-bottom: 10px;
                    display: flex; justify-content: space-between; align-items: center;
                    border: 1px solid #f1f5f9; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                    border-left: 4px solid #10b981;
                }
                .ref-avatar { width: 38px; height: 38px; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border: 1px solid #e2e8f0; }
                .ref-info h4 { font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
                .ref-info p { font-size: 0.65rem; color: #64748b; font-weight: 600; }
                .ref-badge { background: #dcfce7; color: #166534; font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; border: 1px solid #bbf7d0; }

                #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 10px 20px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; z-index: 4000; transition: opacity 0.3s; box-shadow: 0 8px 15px rgba(0,0,0,0.15); }
            `}</style>

            {/* Toast Notification */}
            {toast.visible && <div id="toast" style={{display: 'block'}}>{toast.msg}</div>}

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

            {/* Main Content */}
            <div className="container">
                
                {/* Banner Section */}
                <div className="referral-banner">
                    <div className="banner-icon">🤝</div>
                    <h2 className="banner-title">{t.pageTitle}</h2>
                    <p className="banner-desc">{t.pageDesc}</p>
                    
                    {/* NEW: Reward Text Box */}
                    <div className="reward-pill">
                        ✨ {t.rewardText}
                    </div>
                </div>

                {/* Code & Link Display Section */}
                <div className="code-card">
                    {/* Referral Code */}
                    <div className="code-label">{t.yourCodeText}</div>
                    <div className="code-box">
                        {userData.referralCode}
                    </div>
                    <div className="action-buttons">
                        <button className="btn-action btn-copy" onClick={() => handleCopy(userData.referralCode, 'code')} style={{width: '100%', flex: 'unset'}}>
                            📋 {t.copyBtn}
                        </button>
                    </div>

                    <div className="divider"></div>

                    {/* Referral Link */}
                    <div className="code-label">{t.yourLinkText}</div>
                    <div className="link-box">
                        {referralLink}
                    </div>
                    <div className="action-buttons">
                        <button className="btn-action btn-copy-main" onClick={() => handleCopy(referralLink, 'link')}>
                            🔗 {t.copyLinkBtn}
                        </button>
                        <button className="btn-action btn-share" onClick={handleShare}>
                            🚀 {t.shareBtn}
                        </button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="stats-container">
                    <div className="stat-box">
                        <span>{t.totalReferrals}</span>
                        <b>{userData.totalReferrals.toLocaleString()}</b>
                    </div>
                    <div className="stat-box">
                        <span>{t.friendsJoined}</span>
                        <b style={{ color: '#6366f1' }}>{referralHistory.length.toLocaleString()}</b>
                    </div>
                </div>

                {/* Referral History List */}
                <div className="history-section">
                    <h3 className="history-title">{t.historyTitle}</h3>
                    
                    <div>
                        {isLoadingHistory ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Loading...</div>
                        ) : referralHistory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '25px 20px', background: 'white', borderRadius: '18px', border: '1px dashed #cbd5e1', color: '#94a3b8' }}>
                                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📭</span>
                                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>{t.noHistory}</p>
                            </div>
                        ) : (
                            referralHistory.map((refItem) => (
                                <div key={refItem.id} className="ref-item">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="ref-avatar">👤</div>
                                        <div className="ref-info">
                                            <h4>{refItem.userName || "TaskBazar User"}</h4>
                                            <p>{t.joinedAt} {new Date(refItem.timestamp).toLocaleDateString(currentLang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div className="ref-badge">
                                        Success
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
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


