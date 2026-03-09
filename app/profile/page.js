// File Path: app/profile/page.js "important message for gemini ai"

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, sendEmailVerification, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, update, query, limitToLast } from 'firebase/database';

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
        join: "যোগদান:",
        totalPoints: "মোট পয়েন্ট",
        tasksDone: "সম্পন্ন মিশন",
        referText: "আপনার রেফার কোড",
        copyBtn: "কপি",
        logoutBtn: "লগআউট করুন",
        historyTitle: "সাম্প্রতিক লেনদেন",
        moreHistoryBtn: "আরও লেনদেন দেখুন ⬇",
        editTitle: "প্রোফাইল এডিট",
        editName: "আপনার নাম",
        editAvatar: "প্রোফাইল ছবির লিংক (URL)",
        saveBtn: "সেভ করুন",
        cancelBtn: "বাতিল",
        fullHistoryTitle: "সকল লেনদেন",
        historyCloseBtn: "বন্ধ করুন",
        noTransactions: "কোন লেনদেন পাওয়া যায়নি",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile"
    },
    en: {
        points: "Points",
        join: "Joined:",
        totalPoints: "Total Points",
        tasksDone: "Tasks Done",
        referText: "Your Referral Code",
        copyBtn: "Copy",
        logoutBtn: "Logout Account",
        historyTitle: "Recent Transactions",
        moreHistoryBtn: "View More History ⬇",
        editTitle: "Edit Profile",
        editName: "Your Name",
        editAvatar: "Avatar Link (URL)",
        saveBtn: "Save Changes",
        cancelBtn: "Cancel",
        fullHistoryTitle: "Transaction History",
        historyCloseBtn: "Close History",
        noTransactions: "No transactions found",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile"
    }
};

export default function ProfilePage() {
    const router = useRouter();

    // User & Global States
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({
        points: 0,
        tasksCompleted: 0,
        name: "Loading...",
        avatar: defaultAvatar,
        referralCode: "------",
        createdAt: null
    });
    const [transactions, setTransactions] = useState([]);
    const [currentLang, setCurrentLang] = useState('bn');

    // UI States
    const [toast, setToast] = useState({ msg: "", visible: false });
    const [navOpen, setNavOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isVerifySent, setIsVerifySent] = useState(false);

    // Form States for Edit Profile
    const [editName, setEditName] = useState("");
    const [editAvatar, setEditAvatar] = useState("");

    const t = translations[currentLang];

    // Auth & Data Fetching (Realtime Database)
    useEffect(() => {
        const savedLang = localStorage.getItem('elite_lang') || 'bn';
        setCurrentLang(savedLang);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && appId) { // appId চেক করে নেওয়া হচ্ছে
                setUser(currentUser);

                // Fetch User Stats
                const statsRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/stats`);
                onValue(statsRef, (snap) => {
                    const data = snap.val() || {};
                    setUserData({
                        points: data.points || 0,
                        tasksCompleted: data.tasksCompleted || 0,
                        name: data.name || "TaskBazar User",
                        avatar: (data.avatar && data.avatar !== "null" && data.avatar !== "undefined") ? data.avatar : defaultAvatar,
                        referralCode: data.referralCode || currentUser.uid.substring(0, 6).toUpperCase(),
                        createdAt: data.createdAt || null
                    });

                    // Update form states with fetched data initially
                    setEditName(data.name || "TaskBazar User");
                    setEditAvatar((data.avatar && data.avatar !== "null" && data.avatar !== "undefined") ? data.avatar : "");
                });

                // Fetch Transactions History (Last 20)
                const txRef = query(ref(db, `artifacts/${appId}/users/${currentUser.uid}/transactions`), limitToLast(20));
                onValue(txRef, (snap) => {
                    const trData = snap.val();
                    if (trData) {
                        const trArray = Object.keys(trData)
                            .map(k => ({ id: k, ...trData[k] }))
                            .sort((a, b) => b.timestamp - a.timestamp);
                        setTransactions(trArray);
                    } else {
                        setTransactions([]);
                    }
                });

            } else if (!currentUser) {
                router.push('/login'); // Not logged in
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

    // Notification Mock
    const openNotifications = () => {
        showToast(currentLang === 'bn' ? "নোটিফিকেশন দেখতে হোম পেইজে যান।" : "Go to home page for notifications.");
        setTimeout(() => { router.push('/'); }, 1000);
    };

    // Profile Edit Functions
    const openEditModal = () => setIsEditModalOpen(true);
    const closeEditModal = () => setIsEditModalOpen(false);

    const saveProfile = async () => {
        if (!editName.trim()) return showToast(currentLang === 'bn' ? "নাম ফাঁকা রাখা যাবে না!" : "Name cannot be empty!");

        try {
            await update(ref(db, `artifacts/${appId}/users/${user.uid}/stats`), {
                name: editName.trim(),
                avatar: editAvatar.trim() || defaultAvatar
            });
            showToast(currentLang === 'bn' ? "প্রোফাইল আপডেট হয়েছে! ✅" : "Profile updated! ✅");
            closeEditModal();
        } catch (error) {
            showToast(currentLang === 'bn' ? "আপডেট করতে সমস্যা হয়েছে।" : "Error updating profile.");
        }
    };

    // Email Verification
    const handleVerifyEmail = async () => {
        if (user && !user.emailVerified) {
            try {
                await sendEmailVerification(user);
                showToast("Verification link sent! Check Email 📧");
                setIsVerifySent(true);
            } catch (error) {
                showToast("Error: " + error.message);
            }
        }
    };

    // Copy Referral Code
    const copyReferral = () => {
        if (userData.referralCode && userData.referralCode !== "------") {
            navigator.clipboard.writeText(userData.referralCode).then(() => {
                showToast("Referral Code Copied! 📋");
            });
        }
    };

    // Logout
    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    // Formatting Helpers
    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return date.toLocaleDateString(currentLang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTxTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(currentLang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getTxDetails = (tx) => {
        let icon = '🔄'; let title = tx.desc;
        if (tx.type === 'spin') { icon = '🎡'; title = currentLang === 'bn' ? 'স্পিন থেকে জয়' : 'Won from Spin'; }
        if (tx.type === 'campaign') { icon = '🚀'; title = currentLang === 'bn' ? 'ক্যাম্পেইন তৈরি' : 'Created Campaign'; }
        if (tx.type === 'bonus') { icon = '🎁'; title = currentLang === 'bn' ? 'ডেইলি বোনাস' : 'Daily Bonus'; }
        if (tx.type === 'mission') { icon = '✅'; title = currentLang === 'bn' ? 'মিশন সম্পন্ন' : 'Mission Completed'; }
        return { icon, title };
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
                
                .avatar-frame img, .big-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }

                .notif-btn { position: relative; background: rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 1.1rem; cursor: pointer; }
                
                .header-lang-switch { display: flex; background: rgba(0,0,0,0.1); padding: 3px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); }
                .h-lang-btn { padding: 4px 8px; font-size: 0.55rem; font-weight: 800; border-radius: 8px; cursor: pointer; transition: 0.3s; color: rgba(255,255,255,0.6); }
                .h-lang-btn.active { background: white; color: #6366f1; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

                .wallet-pill { background: rgba(255,255,255,0.15); backdrop-filter: blur(15px); padding: 5px 10px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.25); text-align: right; }
                .wallet-pill span { font-size: 0.45rem; text-transform: uppercase; font-weight: 800; opacity: 0.8; display: block; line-height: 1; }
                .wallet-pill b { display: block; font-size: 0.95rem; font-weight: 800; line-height: 1.2; }

                .container { padding: 0 18px; max-width: 480px; margin: -15px auto 0; position: relative; z-index: 5; }
                .profile-card { background: white; border-radius: 25px; padding: 25px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .big-avatar { width: 90px; height: 90px; border-radius: 30px; margin: 0 auto 15px; border: 3px solid white; box-shadow: 0 8px 20px rgba(99,102,241,0.2); overflow: hidden; background: #f1f5f9; position: relative; }
                
                .edit-badge { position: absolute; bottom: -5px; right: -5px; background: #6366f1; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; border: 2px solid white; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }

                .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
                .stat-box { background: #f8fafc; padding: 15px; border-radius: 20px; border: 1px solid #e2e8f0; }
                .stat-box span { display: block; font-size: 0.65rem; font-weight: 800; color: var(--text-p); text-transform: uppercase; }
                .stat-box b { font-size: 1.1rem; color: #6366f1; }

                .referral-box { margin-top: 20px; background: #f0fdf4; border: 1px dashed #10b981; padding: 15px; border-radius: 18px; display: flex; justify-content: space-between; align-items: center; text-align: left; }
                .referral-box span { font-size: 0.65rem; font-weight: 800; color: #166534; text-transform: uppercase; }
                .referral-box b { display: block; font-size: 1.2rem; color: #10b981; letter-spacing: 2px; }
                .btn-copy { background: #10b981; color: white; border: none; padding: 8px 15px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; cursor: pointer; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); transition: 0.2s; }
                .btn-copy:active { transform: scale(0.95); }

                .history-section { margin-top: 25px; text-align: left; }
                .history-section h3 { font-size: 0.95rem; font-weight: 800; color: #1e293b; margin-bottom: 15px; margin-left: 5px; }
                .history-item { background: #f8fafc; border-radius: 15px; padding: 12px 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #f1f5f9; }
                .history-icon { width: 35px; height: 35px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
                .history-details h4 { font-size: 0.8rem; font-weight: 800; color: #0f172a; }
                .history-details p { font-size: 0.6rem; color: #64748b; font-weight: 600; margin-top: 2px; }
                .amt-plus { color: #10b981; font-weight: 800; font-size: 0.9rem; }
                .amt-minus { color: #f43f5e; font-weight: 800; font-size: 0.9rem; }
                .btn-more-history { width: 100%; background: #f1f5f9; border: 1px dashed #cbd5e1; color: #64748b; font-weight: 800; font-size: 0.75rem; padding: 10px; border-radius: 12px; cursor: pointer; margin-top: 5px; transition: 0.2s; border-style: dashed; }
                .btn-more-history:active { transform: scale(0.98); }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(5px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-content { background: white; width: 100%; max-width: 350px; border-radius: 22px; padding: 20px; text-align: left; animation: popUp 0.3s ease-out; }
                .modal-history-content { background: white; width: 100%; max-width: 400px; border-radius: 22px; padding: 20px; text-align: left; animation: popUp 0.3s ease-out; max-height: 80vh; display: flex; flex-direction: column; }
                
                @keyframes popUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                
                .input-group { margin-bottom: 15px; }
                .input-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-p); margin-bottom: 5px; margin-left: 5px; }
                .input-group input { width: 100%; padding: 12px 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; outline: none; font-size: 0.85rem; }
                .btn-save { width: 100%; padding: 12px; border: none; border-radius: 12px; background: var(--p-gradient); color: white; font-weight: 800; cursor: pointer; margin-top: 10px; }
                .btn-cancel { width: 100%; padding: 12px; border: none; border-radius: 12px; background: #f1f5f9; color: var(--text-p); font-weight: 800; cursor: pointer; margin-top: 10px; }

                #full-transaction-list::-webkit-scrollbar { width: 5px; }
                #full-transaction-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

                .nav-bar-container { position: fixed; bottom: 15px; left: 15px; right: 15px; z-index: 1000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;}
                .expanded-menu { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 20px; padding: 12px; display: flex; gap: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #fff; opacity: 0; transform: translateY(20px); pointer-events: none; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .nav-bar-container.open .expanded-menu { opacity: 1; transform: translateY(0); pointer-events: auto; }
                .nav-bar { height: 65px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-radius: 20px; display: flex; align-items: center; justify-content: space-around; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #fff; pointer-events: auto;}
                .nav-item { display: flex; flex-direction: column; align-items: center; color: #94a3b8; cursor: pointer; text-decoration: none; transition: 0.3s; }
                .nav-item.active { color: #6366f1; transform: translateY(-2px); }
                .nav-item i { font-size: 1.2rem; margin-bottom: 1px; font-style: normal; }
                .nav-item span { font-size: 0.5rem; font-weight: 700; white-space: nowrap; }

                #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 10px 20px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; z-index: 3000; transition: opacity 0.3s ease;}
            `}</style>

            {/* Toast */}
            {toast.visible && <div id="toast" style={{display: 'block'}}>{toast.msg}</div>}

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '15px', color: '#0f172a' }}>{t.editTitle}</h3>
                        <div className="input-group">
                            <label>{t.editName}</label>
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter full name" />
                        </div>
                        <div className="input-group">
                            <label>{t.editAvatar}</label>
                            <input type="url" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="https://example.com/image.png" />
                        </div>
                        <button className="btn-save" onClick={saveProfile}>{t.saveBtn}</button>
                        <button className="btn-cancel" onClick={closeEditModal}>{t.cancelBtn}</button>
                    </div>
                </div>
            )}

            {/* Full History Modal */}
            {isHistoryModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-history-content">
                        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '15px', color: '#0f172a' }}>{t.fullHistoryTitle}</h3>

                        <div id="full-transaction-list" style={{ overflowY: 'auto', flex: 1, paddingRight: '5px', marginBottom: '10px' }}>
                            {transactions.length === 0 ? (
                                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', padding: '10px' }}>{t.noTransactions}</p>
                            ) : (
                                transactions.map(tx => {
                                    const { icon, title } = getTxDetails(tx);
                                    const isPositive = tx.amount > 0;
                                    return (
                                        <div key={tx.id} className="history-item">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="history-icon">{icon}</div>
                                                <div className="history-details">
                                                    <h4>{title}</h4>
                                                    <p>{formatTxTime(tx.timestamp)}</p>
                                                </div>
                                            </div>
                                            <div className={isPositive ? 'amt-plus' : 'amt-minus'}>
                                                {isPositive ? '+' : ''}{tx.amount}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <button className="btn-cancel" onClick={() => setIsHistoryModalOpen(false)}>{t.historyCloseBtn}</button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="header">
                <div className="header-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar-frame">
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
                <div className="profile-card">
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '15px' }}>
                        <div className="big-avatar" style={{ marginBottom: 0 }}>
                            <img src={userData.avatar} onError={(e) => {e.target.src=defaultAvatar}} alt="Avatar Big"/>
                        </div>
                        <div className="edit-badge" onClick={openEditModal}>✏️</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{userData.name}</h2>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-p)', fontWeight: 600 }}>{user?.email || "••••@gmail.com"}</p>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                        {user?.emailVerified ? (
                            <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 800, border: '1px solid #86efac' }}>
                                Verified ✅
                            </span>
                        ) : (
                            <button onClick={handleVerifyEmail} disabled={isVerifySent} style={{ background: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74', padding: '2px 10px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 800, cursor: isVerifySent ? 'not-allowed' : 'pointer', transition: '0.2s', opacity: isVerifySent ? 0.7 : 1 }}>
                                {isVerifySent ? "Sent!" : "Verify Now ⚠️"}
                            </button>
                        )}
                    </div>

                    <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginTop: '8px' }}>
                        <span>{t.join}</span> <span>{formatDate(userData.createdAt)}</span>
                    </p>

                    <div className="stat-grid">
                        <div className="stat-box"><span>{t.totalPoints}</span><b>{userData.points.toLocaleString()}</b></div>
                        <div className="stat-box"><span>{t.tasksDone}</span><b>{userData.tasksCompleted.toLocaleString()}</b></div>
                    </div>

                    <div className="referral-box">
                        <div>
                            <span>{t.referText}</span>
                            <b style={{ letterSpacing: '2px' }}>{userData.referralCode}</b>
                        </div>
                        <button className="btn-copy" onClick={copyReferral}>{t.copyBtn}</button>
                    </div>

                    <div className="history-section">
                        <h3>{t.historyTitle}</h3>
                        <div>
                            {transactions.length === 0 ? (
                                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', padding: '10px' }}>{t.noTransactions}</p>
                            ) : (
                                (() => {
                                    const tx = transactions[0]; // Latest transaction
                                    const { icon, title } = getTxDetails(tx);
                                    const isPositive = tx.amount > 0;
                                    return (
                                        <div className="history-item">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="history-icon">{icon}</div>
                                                <div className="history-details">
                                                    <h4>{title}</h4>
                                                    <p>{formatTxTime(tx.timestamp)}</p>
                                                </div>
                                            </div>
                                            <div className={isPositive ? 'amt-plus' : 'amt-minus'}>
                                                {isPositive ? '+' : ''}{tx.amount}
                                            </div>
                                        </div>
                                    )
                                })()
                            )}
                        </div>

                        {transactions.length > 1 && (
                            <button className="btn-more-history" onClick={() => setIsHistoryModalOpen(true)}>
                                {t.moreHistoryBtn}
                            </button>
                        )}
                    </div>

                    <button onClick={handleLogout} style={{ marginTop: '25px', width: '100%', padding: '12px', borderRadius: '15px', border: '1px solid #fee2e2', background: '#fff5f5', color: 'var(--danger)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', transition: '0.2s' }}>
                        {t.logoutBtn}
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
                    <div className="nav-item" onClick={() => router.push('/order')}><i>🚀</i><span>{t.navPromote}</span></div>
                    <div className="nav-item active"><i>👤</i><span>{t.navProfile}</span></div>
                    <div className="nav-item" onClick={() => setNavOpen(!navOpen)}>
                        <i style={{ transition: '0.3s', fontStyle: 'normal', fontSize: '1.3rem', transform: navOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</i>
                        <span>Menu</span>
                    </div>
                </div>
            </div>
        </>
    );
}
