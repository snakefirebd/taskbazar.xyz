// File Path: app/complaint/page.js "important message for gemini ai"

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, set, serverTimestamp } from 'firebase/database';

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

    // Global & Header/Footer States
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ points: 0, name: "Member", avatar: defaultAvatar });
    const [currentLang, setCurrentLang] = useState('bn');
    const [toast, setToast] = useState({ msg: "", visible: false });
    const [navOpen, setNavOpen] = useState(false);
    const [hasNewNotif, setHasNewNotif] = useState(false);
    const [view, setView] = useState('support-view');

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

    // Header & Footer Actions
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

                #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 10px 20px; border-radius: 50px; font-size: 0.75rem; z-index: 3000; transition: opacity 0.3s; }
            `}</style>

            {toast.visible && <div id="toast" style={{ display: 'block' }}>{toast.msg}</div>}

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
            
            {/* Special Menu Style Fix for 'Support' */}
            <style>{`
                 /* Highlight support icon in expanded menu */
                 .hf-expanded-menu .hf-nav-item:nth-child(2) div { background: #f1f5f9 !important; color: #64748b !important; }
            `}</style>
        </>
    );
}

