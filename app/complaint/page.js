// File Path: app/complaint/page.js "important message for gemini ai"

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, set, serverTimestamp } from 'firebase/database';

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
        titleCenter: "অভিযোগ কেন্দ্র",
        selectPage: "কোন পেজে সমস্যা হচ্ছে?",
        detailsLabel: "বিস্তারিত লিখুন",
        detailsPlaceholder: "আপনার সমস্যাটি বিস্তারিত লিখুন...",
        submitBtn: "অভিযোগ জমা দিন 🚀",
        historyTitle: "আমার অভিযোগের ইতিহাস",
        noHistory: "কোন ইতিহাস পাওয়া যায়নি।",
        statusPending: "PENDING",
        statusSolved: "SOLVED",
        adminReply: "Admin:",
        errorEmpty: "বিবরণ লিখুন!",
        errorSubmit: "ত্রুটি হয়েছে!",
        successSubmit: "অভিযোগ জমা হয়েছে!",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navSupport: "Support",
        navLeaderboard: "Leaderboard",
        navMenu: "Menu"
    },
    en: {
        points: "Points",
        titleCenter: "Complaint Center",
        selectPage: "Which page has the issue?",
        detailsLabel: "Write details",
        detailsPlaceholder: "Describe your issue in detail...",
        submitBtn: "Submit Complaint 🚀",
        historyTitle: "My Complaint History",
        noHistory: "No history found.",
        statusPending: "PENDING",
        statusSolved: "SOLVED",
        adminReply: "Admin:",
        errorEmpty: "Please enter details!",
        errorSubmit: "An error occurred!",
        successSubmit: "Complaint submitted successfully!",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navSupport: "Support",
        navLeaderboard: "Leaderboard",
        navMenu: "Menu"
    }
};

export default function ComplaintPage() {
    const router = useRouter();

    // States
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ points: 0, name: "Member", avatar: defaultAvatar });
    const [currentLang, setCurrentLang] = useState('bn');
    const [toast, setToast] = useState({ msg: "", visible: false });
    const [navOpen, setNavOpen] = useState(false);

    // Form States
    const [complaintPage, setComplaintPage] = useState("Home/Missions");
    const [complaintDetails, setComplaintDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // History State
    const [historyList, setHistoryList] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const t = translations[currentLang];

    // Auth & Data Fetch
    useEffect(() => {
        const savedLang = localStorage.getItem('elite_lang') || 'bn';
        setCurrentLang(savedLang);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && appId) { // appId চেক করে নেওয়া হচ্ছে
                setUser(currentUser);

                // User Stats
                const statsRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/stats`);
                onValue(statsRef, (snap) => {
                    const d = snap.val() || {};
                    setUserData({
                        points: d.points || 0,
                        name: d.name || "Member",
                        avatar: (d.avatar && d.avatar !== "null" && d.avatar !== "undefined") ? d.avatar : defaultAvatar
                    });
                });

                // Complaint History
                const complaintsRef = ref(db, `artifacts/${appId}/public/data/complaints`);
                onValue(complaintsRef, (snap) => {
                    const all = snap.val() || {};
                    const myComplaints = Object.keys(all)
                        .map(k => ({ id: k, ...all[k] }))
                        .filter(c => c.userId === currentUser.uid)
                        .sort((a, b) => b.timestamp - a.timestamp);

                    setHistoryList(myComplaints);
                    setIsLoadingHistory(false);
                });

            } else if (!currentUser) {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast({ msg: "", visible: false }), 3000);
    };

    const changeLang = (lang) => {
        setCurrentLang(lang);
        localStorage.setItem('elite_lang', lang);
    };

    const openNotifications = () => {
        showToast(currentLang === 'bn' ? "নোটিফিকেশন দেখতে হোম পেইজে যান।" : "Go to home page for notifications.");
        setTimeout(() => { router.push('/'); }, 1000);
    };

    const submitComplaint = async () => {
        if (!complaintDetails.trim()) {
            return showToast(t.errorEmpty);
        }
        if (!appId) return showToast(t.errorSubmit);

        setIsSubmitting(true);
        const cid = "comp_" + Date.now();

        try {
            const complaintRef = ref(db, `artifacts/${appId}/public/data/complaints/${cid}`);
            await set(complaintRef, {
                userId: user.uid,
                page: complaintPage,
                details: complaintDetails.trim(),
                status: 'pending',
                reply: '',
                timestamp: serverTimestamp()
            });

            showToast(t.successSubmit);
            setComplaintDetails("");
        } catch (e) {
            showToast(t.errorSubmit);
        } finally {
            setIsSubmitting(false);
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
                    --glass: rgba(255, 255, 255, 0.85);
                    --text-h: #0f172a;
                    --text-p: #64748b;
                    --danger: #f43f5e;
                }

                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent;}
                body { background: var(--bg); color: var(--text-h); padding-bottom: 120px; line-height: 1.6; }

                /* Header */
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
                }
                .avatar-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }

                .header-lang-switch { display: flex; background: rgba(0,0,0,0.1); padding: 3px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); }
                .h-lang-btn { padding: 4px 8px; font-size: 0.55rem; font-weight: 800; border-radius: 8px; cursor: pointer; transition: 0.3s; color: rgba(255,255,255,0.6); }
                .h-lang-btn.active { background: white; color: #6366f1; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

                .wallet-pill { background: rgba(255,255,255,0.15); backdrop-filter: blur(15px); padding: 5px 10px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.25); text-align: right; flex-shrink: 0; }
                .wallet-pill span { font-size: 0.45rem; text-transform: uppercase; font-weight: 800; opacity: 0.8; display: block; line-height: 1; }
                .wallet-pill b { display: block; font-size: 0.95rem; font-weight: 800; line-height: 1.2; }

                .notif-btn { position: relative; background: rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 1.1rem; cursor: pointer; }

                /* Container */
                .container { padding: 18px; max-width: 480px; margin: 0 auto; }
                .elite-card { background: white; border-radius: 22px; padding: 20px; margin-bottom: 15px; border: 1px solid #e2e8f0; box-shadow: 0 8px 20px rgba(0,0,0,0.02); }
                
                .input-group { margin-bottom: 14px; }
                .input-group label { display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-p); margin-bottom: 5px; margin-left: 5px; }
                .input-group select, .input-group textarea { width: 100%; padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 15px; outline: none; font-size: 0.9rem; transition: 0.3s;}
                .input-group select:focus, .input-group textarea:focus { border-color: #6366f1; }
                
                .btn-elite { width: 100%; padding: 14px; border: none; border-radius: 16px; background: var(--p-gradient); color: white; font-weight: 700; cursor: pointer; box-shadow: var(--p-glow); transition: 0.3s; }
                .btn-elite:active { transform: scale(0.97); }
                .btn-elite:disabled { opacity: 0.7; cursor: not-allowed; }

                .complaint-item { background: white; padding: 15px; border-radius: 15px; margin-bottom: 10px; border-left: 4px solid #6366f1; animation: slideUp 0.3s ease-out; }
                .status-badge { font-size: 0.6rem; padding: 3px 8px; border-radius: 5px; font-weight: 800; float: right; }
                .status-pending { background: #fef3c7; color: #92400e; }
                .status-solved { background: #dcfce7; color: #166534; }
                
                @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                /* Nav Bar */
                .nav-bar-container { position: fixed; bottom: 15px; left: 15px; right: 15px; z-index: 1000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;}
                .expanded-menu { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 20px; padding: 12px; display: flex; gap: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #fff; opacity: 0; transform: translateY(20px); pointer-events: none; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .nav-bar-container.open .expanded-menu { opacity: 1; transform: translateY(0); pointer-events: auto; }
                
                .nav-bar { height: 65px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-radius: 20px; display: flex; align-items: center; justify-content: space-around; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #fff; pointer-events: auto;}
                .nav-item { display: flex; flex-direction: column; align-items: center; color: #94a3b8; cursor: pointer; text-decoration: none; transition: 0.3s; }
                .nav-item.active { color: #6366f1; transform: translateY(-2px); }
                .nav-item i { font-size: 1.2rem; margin-bottom: 1px; font-style: normal; }
                .nav-item span { font-size: 0.5rem; font-weight: 700; white-space: nowrap; }

                #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 10px 20px; border-radius: 50px; font-size: 0.75rem; z-index: 3000; transition: opacity 0.3s; }
            `}</style>

            {toast.visible && <div id="toast" style={{ display: 'block' }}>{toast.msg}</div>}

            {/* Header Section */}
            <div className="header">
                <div className="header-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar-frame" onClick={() => router.push('/profile')}>
                            <img src={userData.avatar} onError={(e) => {e.target.src=defaultAvatar}} alt="Avatar"/>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '0.75rem', fontWeight: 800 }}>{userData.name.split(' ')[0]}</h2>
                            <span style={{ fontSize: '0.45rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '6px' }}>PRO</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="notif-btn" onClick={openNotifications}>
                            🔔
                        </div>
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

            {/* Main Content */}
            <div className="container">
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '15px 0 10px 5px' }}>{t.titleCenter}</h3>

                <div className="elite-card">
                    <div className="input-group">
                        <label>{t.selectPage}</label>
                        <select value={complaintPage} onChange={(e) => setComplaintPage(e.target.value)}>
                            <option value="Home/Missions">Home / Missions</option>
                            <option value="Promote">Promote Page</option>
                            <option value="Profile">Profile Page</option>
                            <option value="Spin/Bonus">Spin / Daily Bonus</option>
                            <option value="Payment">Payment/Withdraw</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>{t.detailsLabel}</label>
                        <textarea 
                            rows="4" 
                            placeholder={t.detailsPlaceholder}
                            value={complaintDetails}
                            onChange={(e) => setComplaintDetails(e.target.value)}
                        ></textarea>
                    </div>
                    <button 
                        className="btn-elite" 
                        onClick={submitComplaint}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Processing..." : t.submitBtn}
                    </button>
                </div>

                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '20px 0 10px 5px' }}>{t.historyTitle}</h3>

                <div id="history-list">
                    {isLoadingHistory ? (
                        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', padding: '20px' }}>Loading...</p>
                    ) : historyList.length === 0 ? (
                        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', padding: '20px' }}>{t.noHistory}</p>
                    ) : (
                        historyList.map(c => {
                            const isSolved = c.status === 'solved';
                            return (
                                <div key={c.id} className="complaint-item" style={{ borderLeftColor: isSolved ? '#10b981' : '#6366f1' }}>
                                    <span className={`status-badge ${isSolved ? 'status-solved' : 'status-pending'}`}>
                                        {isSolved ? t.statusSolved : t.statusPending}
                                    </span>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{c.page}</div>
                                    <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginBottom: '8px' }}>
                                        {new Date(c.timestamp).toLocaleString(currentLang === 'bn' ? 'bn-BD' : 'en-US')}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#475569' }}>{c.details}</p>

                                    {c.reply && (
                                        <div style={{ marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.7rem', border: '1px dashed #cbd5e1' }}>
                                            <b>{t.adminReply}</b> {c.reply}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Navigation Bar */}
            <div className={`nav-bar-container ${navOpen ? 'open' : ''}`}>
                <div className="expanded-menu">
                    <div onClick={() => router.push('/leaderboard')} className="nav-item">
                        <i style={{ background: '#fdf2f8', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>🏆</i>
                        <span style={{ fontSize: '0.6rem' }}>{t.navLeaderboard}</span>
                    </div>

                    <div onClick={() => router.push('/complaint')} className="nav-item active">
                        <i style={{ background: '#f1f5f9', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>🛠️</i>
                        <span style={{ fontSize: '0.6rem' }}>{t.navSupport}</span>
                    </div>
                </div>

                <div className="nav-bar">
                    <div className="nav-item" onClick={() => router.push('/')}><i>🏠</i><span>{t.navMissions}</span></div>
                    <div className="nav-item" onClick={() => router.push('/order')}><i>🚀</i><span>{t.navPromote}</span></div>
                    <div className="nav-item" onClick={() => router.push('/profile')}><i>👤</i><span>{t.navProfile}</span></div>
                    <div className="nav-item" onClick={() => setNavOpen(!navOpen)}>
                        <i style={{ transition: '0.3s', fontStyle: 'normal', fontSize: '1.3rem', transform: navOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</i>
                        <span>{t.navMenu}</span>
                    </div>
                </div>
            </div>
        </>
    );
}