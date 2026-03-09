// File Path: app/manage_tasks/page.js "important message for gemini ai"

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, update, set, push, serverTimestamp, query, orderByChild, equalTo } from 'firebase/database';

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
        tabMyCamp: "আমার ক্যাম্পেইন",
        tabPending: "পেন্ডিং প্রুফ",
        loading: "লোড হচ্ছে...",
        noCampaigns: "আপনার কোন ক্যাম্পেইন নেই।",
        reward: "Reward",
        done: "সম্পন্ন",
        btnDelete: "🗑️ Delete",
        allCampaigns: "সব ক্যাম্পেইন",
        noPending: "কোন পেন্ডিং প্রুফ পাওয়া যায়নি।",
        userProof: "ব্যবহারকারীর প্রমাণ:",
        btnApprove: "✅ Approve",
        btnReject: "❌ Reject",
        btnReport: "🚩 ফেক রিপোর্ট করুন",
        yesConfirm: "হ্যাঁ, নিশ্চিত",
        cancel: "বাতিল",
        deleteConfirmTitle: "ক্যাম্পেইন ডিলিট করবেন?",
        deleteConfirmSubMsg: "বাকি থাকা টার্গেটের জন্য {pts} পয়েন্ট ব্যালেন্সে রিফান্ড করা হবে।",
        deleteConfirmNoRefund: "এই কাজটির টার্গেট পূরণ হয়ে গেছে।",
        approveConfirmTitle: "প্রুফটি এপ্রুভ করবেন?",
        rejectConfirmTitle: "প্রুফটি রিজেক্ট করবেন?",
        reportConfirmTitle: "ফেক প্রুফ রিপোর্ট করবেন?",
        reportConfirmSubMsg: "রিপোর্ট করলে অ্যাডমিন এটি রিভিউ করে ব্যবস্থা নেবেন।",
        navManage: "Manage",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu"
    },
    en: {
        points: "Points",
        tabMyCamp: "My Campaigns",
        tabPending: "Pending Proofs",
        loading: "Loading...",
        noCampaigns: "You have no campaigns.",
        reward: "Reward",
        done: "Done",
        btnDelete: "🗑️ Delete",
        allCampaigns: "All Campaigns",
        noPending: "No pending proofs found.",
        userProof: "User Proof:",
        btnApprove: "✅ Approve",
        btnReject: "❌ Reject",
        btnReport: "🚩 Report Fake",
        yesConfirm: "Yes, Confirm",
        cancel: "Cancel",
        deleteConfirmTitle: "Delete Campaign?",
        deleteConfirmSubMsg: "You will be refunded {pts} points for the remaining target.",
        deleteConfirmNoRefund: "This campaign is already fully completed.",
        approveConfirmTitle: "Approve this proof?",
        rejectConfirmTitle: "Reject this proof?",
        reportConfirmTitle: "Report fake proof?",
        reportConfirmSubMsg: "Admin will review this report and take action.",
        navManage: "Manage",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu"
    }
};

export default function ManageTasksPage() {
    const router = useRouter();

    // User States
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ points: 0, name: "Member", avatar: defaultAvatar });
    const [currentLang, setCurrentLang] = useState('bn');
    const [navOpen, setNavOpen] = useState(false);
    const [toast, setToast] = useState({ msg: "", visible: false });

    // Page States
    const [activeTab, setActiveTab] = useState('my-campaigns');
    const [filterTask, setFilterTask] = useState('ALL');

    // Data States
    const [myCampaignsData, setMyCampaignsData] = useState({});
    const [allSubmissionsData, setAllSubmissionsData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [confirmModal, setConfirmModal] = useState({ show: false, title: "", subMsg: "", action: null });

    const t = translations[currentLang];

    // Initialize & Fetch Auth Data
    useEffect(() => {
        const savedLang = localStorage.getItem('elite_lang') || 'bn';
        setCurrentLang(savedLang);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && appId) { // appId নিশ্চিত করে নেওয়া হচ্ছে
                setUser(currentUser);

                // Fetch User Stats
                const statsRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/stats`);
                onValue(statsRef, (snap) => {
                    const d = snap.val() || {};
                    setUserData({
                        points: d.points || 0,
                        name: d.name || "Member",
                        avatar: (d.avatar && d.avatar !== "null" && d.avatar !== "undefined") ? d.avatar : defaultAvatar
                    });
                });

                // Fetch Current User's Campaigns
                const campaignsRef = query(ref(db, `artifacts/${appId}/public/data/microtasks`), orderByChild('creatorId'), equalTo(currentUser.uid));
                onValue(campaignsRef, (snap) => {
                    setMyCampaignsData(snap.val() || {});
                    setIsLoading(false);
                });

                // Fetch All Submissions
                const subsRef = ref(db, `artifacts/${appId}/public/data/submissions`);
                onValue(subsRef, (snap) => {
                    setAllSubmissionsData(snap.val() || {});
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

    // Make Proof URLs Clickable
    const formatProofText = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" style="color: #6366f1; text-decoration: underline;">${url}</a>`;
        });
    };

    // Action Handlers
    const handleDeleteCampaign = (taskId, qty, reward, approvedCount) => {
        const remainingQty = qty - approvedCount;
        const refundPoints = remainingQty > 0 ? remainingQty * (reward + 1) : 0;

        const subMsg = refundPoints > 0 
            ? t.deleteConfirmSubMsg.replace('{pts}', refundPoints)
            : t.deleteConfirmNoRefund;

        setConfirmModal({
            show: true,
            title: t.deleteConfirmTitle,
            subMsg: subMsg,
            action: async () => {
                setConfirmModal({ show: false });
                try {
                    const token = await user.getIdToken();
                    const response = await fetch('/api/delete-campaign', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ taskId, refundPoints })
                    });
                    const data = await response.json();
                    if (data.success) {
                        showToast(currentLang === 'bn' ? "ক্যাম্পেইন ডিলিট করা হয়েছে! 🗑️" : "Campaign Deleted! 🗑️");
                    } else {
                        showToast(data.error || "Failed to delete");
                    }
                } catch (e) { showToast("Network Error."); }
            }
        });
    };

    const handleReviewProof = (taskId, subId, workerId, rewardPoints, newStatus) => {
        const title = newStatus === 'approved' ? t.approveConfirmTitle : t.rejectConfirmTitle;

        setConfirmModal({
            show: true,
            title: title,
            subMsg: "",
            action: async () => {
                setConfirmModal({ show: false });
                try {
                    const token = await user.getIdToken();
                    const response = await fetch('/api/review-proof', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ taskId, subId, workerId, rewardPoints, newStatus })
                    });
                    const data = await response.json();
                    if (data.success) {
                        showToast(newStatus === 'approved' ? "Approved! ✅" : "Rejected! ❌");
                    } else {
                        showToast(data.error || "Server Error");
                    }
                } catch (error) { showToast("Network Error."); }
            }
        });
    };

    const handleReportProof = (taskId, subId, workerId) => {
        setConfirmModal({
            show: true,
            title: t.reportConfirmTitle,
            subMsg: t.reportConfirmSubMsg,
            action: async () => {
                setConfirmModal({ show: false });
                try {
                    // Update Submission Status
                    await update(ref(db, `artifacts/${appId}/public/data/submissions/${taskId}/${subId}`), {
                        status: 'reported',
                        reportedAt: serverTimestamp()
                    });

                    // Add to Reports Collection
                    await set(ref(db, `artifacts/${appId}/public/data/reports/${Date.now()}`), {
                        taskId, subId, workerId, reporterId: user.uid,
                        reason: 'Fake Proof Submitted',
                        timestamp: serverTimestamp(),
                        status: 'pending'
                    });

                    // Send Notification to Spammer
                    const notifTitle = currentLang === 'bn' ? 'ওয়ার্নিং: প্রুফ রিপোর্ট করা হয়েছে 🚩' : 'Warning: Proof Reported 🚩';
                    const notifMsg = currentLang === 'bn' 
                        ? 'আপনার জমা দেওয়া একটি প্রুফ ফেক হিসেবে রিপোর্ট করা হয়েছে। অ্যাডমিন এটি চেক করছেন।' 
                        : 'One of your proofs was reported as fake. Admin is reviewing it.';

                    await push(ref(db, `artifacts/${appId}/users/${workerId}/notifications`), {
                        title: notifTitle, message: notifMsg, timestamp: serverTimestamp()
                    });

                    showToast(currentLang === 'bn' ? "রিপোর্ট সফলভাবে জমা হয়েছে! 🚩" : "Report submitted successfully! 🚩");
                } catch (error) { showToast("Error submitting report."); }
            }
        });
    };

    // Calculate Data for Rendering
    const sortedCampaigns = Object.keys(myCampaignsData).sort((a, b) => myCampaignsData[b].timestamp - myCampaignsData[a].timestamp);

    // Aggregating pending proofs based on filter
    const pendingProofsList = [];
    Object.keys(myCampaignsData).forEach(taskId => {
        if (filterTask !== 'ALL' && filterTask !== taskId) return;
        const task = myCampaignsData[taskId];
        const subsForTask = allSubmissionsData[taskId] || {};

        Object.keys(subsForTask).forEach(subId => {
            const sub = subsForTask[subId];
            if (sub.status === 'pending') {
                pendingProofsList.push({ subId, taskId, task, sub });
            }
        });
    });

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

                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent;}
                body { background: var(--bg); color: var(--text-h); line-height: 1.6; padding-bottom: 120px; }

                /* Header */
                .header { background: var(--p-gradient); color: white; padding: 12px 15px 25px; border-bottom-left-radius: 25px; border-bottom-right-radius: 25px; position: sticky; top: 0; z-index: 100; box-shadow: 0 5px 15px rgba(99, 102, 241, 0.15); }
                .header-content { display: flex; justify-content: space-between; align-items: center; max-width: 500px; margin: 0 auto; gap: 8px; }
                .avatar-frame { width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,0.2); border: 1.5px solid rgba(255,255,255,0.4); backdrop-filter: blur(10px); overflow: hidden; display: flex; justify-content: center; align-items: center; flex-shrink: 0; cursor: pointer; }
                .avatar-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .header-lang-switch { display: flex; background: rgba(0,0,0,0.1); padding: 3px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); }
                .h-lang-btn { padding: 4px 8px; font-size: 0.55rem; font-weight: 800; border-radius: 8px; cursor: pointer; transition: 0.3s; color: rgba(255,255,255,0.6); }
                .h-lang-btn.active { background: white; color: #6366f1; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .wallet-pill { background: rgba(255,255,255,0.15); backdrop-filter: blur(15px); padding: 5px 10px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.25); text-align: right; }
                .wallet-pill span { font-size: 0.45rem; text-transform: uppercase; font-weight: 800; opacity: 0.8; display: block; line-height: 1; }
                .wallet-pill b { display: block; font-size: 0.95rem; font-weight: 800; line-height: 1.2; }

                .container { padding: 0 18px; max-width: 480px; margin: 20px auto 0; }
                
                /* Tabs */
                .tab-container { display: flex; background: white; border-radius: 15px; padding: 5px; margin-bottom: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
                .tab-btn { flex: 1; text-align: center; padding: 10px; font-size: 0.8rem; font-weight: 800; color: var(--text-p); border-radius: 10px; cursor: pointer; transition: 0.3s; }
                .tab-btn.active { background: #6366f1; color: white; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2); }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .view-container { animation: fadeIn 0.3s ease; }

                /* Campaign Cards */
                .elite-card { background: white; border-radius: 22px; padding: 18px; margin-bottom: 15px; border: 1px solid #e2e8f0; box-shadow: 0 8px 20px rgba(0,0,0,0.02); }
                .campaign-item { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #cbd5e1; position: relative; }
                .campaign-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
                .c-title { font-size: 0.9rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; padding-right: 65px; }
                .c-info { font-size: 0.7rem; color: #64748b; font-weight: 600; display: flex; justify-content: space-between; margin-bottom: 10px; }
                .progress-container { background: #f1f5f9; border-radius: 10px; height: 8px; width: 100%; overflow: hidden; margin-top: 5px; }
                .progress-fill { background: var(--p-gradient); height: 100%; border-radius: 10px; transition: width 0.4s; }
                .btn-delete { position: absolute; top: 0; right: 0; background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; padding: 5px 8px; border-radius: 8px; font-size: 0.65rem; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .btn-delete:active { transform: scale(0.9); }

                /* Proof List */
                .filter-select { width: 100%; padding: 12px 15px; background: white; border: 1px solid #e2e8f0; border-radius: 15px; outline: none; font-size: 0.85rem; font-weight: 700; color: var(--text-h); margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
                .proof-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 15px; padding: 12px; margin-bottom: 12px; }
                .proof-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
                .proof-text { font-size: 0.8rem; font-weight: 600; color: #1e293b; background: white; padding: 10px; border-radius: 10px; border: 1px dashed #cbd5e1; word-break: break-all; }
                .action-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
                .btn-approve { background: #10b981; color: white; border: none; padding: 10px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); transition: 0.2s; }
                .btn-reject { background: #f43f5e; color: white; border: none; padding: 10px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer; box-shadow: 0 4px 10px rgba(244, 63, 94, 0.2); transition: 0.2s; }
                .btn-report { grid-column: span 2; background: #fffbeb; color: #d97706; border: 1px solid #fde68a; padding: 8px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.2s; }
                .btn-approve:active, .btn-reject:active, .btn-report:active { transform: scale(0.96); }

                /* Custom Confirm Modal */
                .confirm-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(5px); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .confirm-modal-content { background: white; width: 100%; max-width: 320px; border-radius: 22px; padding: 25px 20px; text-align: center; animation: popUp 0.3s ease-out; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
                .confirm-btn-grp { display: flex; gap: 10px; margin-top: 20px; }
                .btn-yes { flex: 1; padding: 12px; background: var(--p-gradient); color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; }
                .btn-no { flex: 1; padding: 12px; background: #f1f5f9; color: var(--text-p); border: none; border-radius: 12px; font-weight: 800; cursor: pointer; }

                /* Bottom Nav */
                .nav-bar-container { position: fixed; bottom: 15px; left: 15px; right: 15px; z-index: 1000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;}
                .expanded-menu { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 20px; padding: 12px; display: flex; gap: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #fff; opacity: 0; transform: translateY(20px); pointer-events: none; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .nav-bar-container.open .expanded-menu { opacity: 1; transform: translateY(0); pointer-events: auto; }
                .nav-bar { height: 65px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-radius: 20px; display: flex; align-items: center; justify-content: space-around; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #fff; pointer-events: auto;}
                .nav-item { display: flex; flex-direction: column; align-items: center; color: #94a3b8; cursor: pointer; text-decoration: none; transition: 0.3s; }
                .nav-item.active { color: #6366f1; transform: translateY(-2px); }
                .nav-item i { font-size: 1.2rem; margin-bottom: 1px; font-style: normal; }
                .nav-item span { font-size: 0.5rem; font-weight: 700; white-space: nowrap; }

                @keyframes popUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 10px 20px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; z-index: 4000; transition: opacity 0.3s; }
            `}</style>

            {/* Toast */}
            {toast.visible && <div id="toast" style={{display: 'block'}}>{toast.msg}</div>}

            {/* Confirm Modal */}
            {confirmModal.show && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-content">
                        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>❓</div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginBottom: '5px' }}>{confirmModal.title}</h3>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{confirmModal.subMsg}</p>
                        <div className="confirm-btn-grp">
                            <button className="btn-yes" onClick={confirmModal.action}>{t.yesConfirm}</button>
                            <button className="btn-no" onClick={() => setConfirmModal({show: false})}>{t.cancel}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
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

            {/* Container */}
            <div className="container">
                {/* Tabs */}
                <div className="tab-container">
                    <div className={`tab-btn ${activeTab === 'my-campaigns' ? 'active' : ''}`} onClick={() => setActiveTab('my-campaigns')}>{t.tabMyCamp}</div>
                    <div className={`tab-btn ${activeTab === 'pending-proofs' ? 'active' : ''}`} onClick={() => setActiveTab('pending-proofs')}>{t.tabPending}</div>
                </div>

                {/* View 1: My Campaigns */}
                {activeTab === 'my-campaigns' && (
                    <div className="view-container">
                        <div className="elite-card" style={{ padding: '10px', background: sortedCampaigns.length === 0 ? 'transparent' : 'white', border: sortedCampaigns.length === 0 ? 'none' : '', boxShadow: sortedCampaigns.length === 0 ? 'none' : '' }}>
                            {isLoading ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '20px' }}>{t.loading}</p>
                            ) : sortedCampaigns.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '20px' }}>{t.noCampaigns}</p>
                            ) : (
                                sortedCampaigns.map(taskId => {
                                    const task = myCampaignsData[taskId];
                                    let approvedCount = 0;
                                    const subsForTask = allSubmissionsData[taskId] || {};
                                    Object.values(subsForTask).forEach(s => {
                                        if (s.status === 'approved') approvedCount++;
                                    });
                                    const progressPercent = Math.min(100, (approvedCount / task.qty) * 100);

                                    return (
                                        <div key={taskId} className="campaign-item">
                                            <div className="c-title">{task.title}</div>
                                            <button className="btn-delete" onClick={() => handleDeleteCampaign(taskId, task.qty, task.reward, approvedCount)}>{t.btnDelete}</button>

                                            <div className="c-info">
                                                <span>{t.reward}: {task.reward} Pts</span>
                                                <span style={{ fontWeight: 800, color: '#6366f1' }}>{approvedCount} / {task.qty} {t.done}</span>
                                            </div>

                                            <div className="progress-container">
                                                <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* View 2: Pending Proofs */}
                {activeTab === 'pending-proofs' && (
                    <div className="view-container">
                        <select className="filter-select" value={filterTask} onChange={(e) => setFilterTask(e.target.value)}>
                            <option value="ALL">{t.allCampaigns}</option>
                            {Object.keys(myCampaignsData).map(taskId => (
                                <option key={taskId} value={taskId}>{myCampaignsData[taskId].title}</option>
                            ))}
                        </select>

                        <div>
                            {pendingProofsList.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '20px' }}>{t.noPending}</p>
                            ) : (
                                pendingProofsList.map(({ subId, taskId, task, sub }) => (
                                    <div key={subId} className="proof-box">
                                        <div className="proof-header">
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1' }}>{task.title}</span>
                                            <span style={{ fontSize: '0.65rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>{task.reward} Pts</span>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '5px' }}>{t.userProof}</div>
                                        <div className="proof-text" dangerouslySetInnerHTML={{ __html: formatProofText(sub.proof) }} />

                                        <div className="action-btns">
                                            <button className="btn-approve" onClick={() => handleReviewProof(taskId, subId, sub.userId, task.reward, 'approved')}>{t.btnApprove}</button>
                                            <button className="btn-reject" onClick={() => handleReviewProof(taskId, subId, sub.userId, task.reward, 'rejected')}>{t.btnReject}</button>
                                            <button className="btn-report" onClick={() => handleReportProof(taskId, subId, sub.userId)}>{t.btnReport}</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Nav */}
            <div className={`nav-bar-container ${navOpen ? 'open' : ''}`}>
                <div className="expanded-menu">
                    <div onClick={() => router.push('/manage')} className="nav-item active">
                        <i style={{ background: '#fef2f2', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>⚙️</i>
                        <span style={{ fontSize: '0.6rem' }}>{t.navManage}</span>
                    </div>
                    <div onClick={() => router.push('/leaderboard')} className="nav-item">
                        <i style={{ background: '#fdf2f8', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>🏆</i>
                        <span style={{ fontSize: '0.6rem' }}>{t.navLeaderboard}</span>
                    </div>
                    <div onClick={() => router.push('/complaint')} className="nav-item">
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