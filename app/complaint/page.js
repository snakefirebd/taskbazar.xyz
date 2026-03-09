// File Path: app/complaint/page.js

"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, set, push, serverTimestamp } from 'firebase/database';

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
const db = getDatabase(app); // Realtime Database
const appId = firebaseConfig.projectId; 
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const translations = {
    bn: {
        points: "পয়েন্ট",
        titleCenter: "সাপোর্ট ও অভিযোগ",
        supportGreeting: "ওয়েবসাইটের কোন জায়গায় সমস্যায় পড়েছেন? এখনি অভিযোগ জানান! এটি খুব দ্রুত সমাধান করা হবে এবং আপনাকে পুরস্কৃত করা হবে। 🎁",
        btnChatAdmin: "💬 লাইভ চ্যাট করুন",
        btnSubmitIssue: "📝 অভিযোগ বক্স",
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
        chatInputPlaceholder: "আপনার মেসেজ লিখুন...",
        chatEmpty: "এডমিনের সাথে কথা শুরু করুন 👋",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navSupport: "Support",
        navLeaderboard: "Leaderboard",
        navMenu: "Menu"
    },
    en: {
        points: "Points",
        titleCenter: "Support & Complaint",
        supportGreeting: "Facing an issue anywhere on the website? Report it right now! It will be resolved very quickly, and you will be rewarded. 🎁",
        btnChatAdmin: "💬 Live Chat",
        btnSubmitIssue: "📝 Complaint Box",
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
        chatInputPlaceholder: "Type your message...",
        chatEmpty: "Start chatting with admin 👋",
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
    const chatEndRef = useRef(null);

    // Global States
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ points: 0, name: "Member", avatar: defaultAvatar });
    const [currentLang, setCurrentLang] = useState('bn');
    const [toast, setToast] = useState({ msg: "", visible: false });
    const [navOpen, setNavOpen] = useState(false);
    const [hasNewNotif, setHasNewNotif] = useState(false);
    const [view, setView] = useState('support-view');

    // UI Tab State: 'none', 'chat', or 'form'
    const [activeTab, setActiveTab] = useState('none');

    // Form States
    const [complaintPage, setComplaintPage] = useState("Home/Missions");
    const [complaintDetails, setComplaintDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // Chat States
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [isSendingChat, setIsSendingChat] = useState(false);

    const t = translations[currentLang];

    // Auth & Data Fetch
    useEffect(() => {
        const savedLang = localStorage.getItem('elite_lang') || 'bn';
        setCurrentLang(savedLang);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && appId) { 
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

                // Complaint History (Form)
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

                // Live Chat History
                const chatRef = ref(db, `artifacts/${appId}/public/data/live_chats/${currentUser.uid}/messages`);
                onValue(chatRef, (snap) => {
                    const all = snap.val() || {};
                    const msgs = Object.keys(all)
                        .map(k => ({ id: k, ...all[k] }))
                        .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending for chat
                    
                    setChatMessages(msgs);
                });

            } else if (!currentUser) {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Auto scroll chat to bottom
    useEffect(() => {
        if (activeTab === 'chat' && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, activeTab]);

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

    // --- FORM SUBMIT FUNCTION ---
    const submitComplaint = async () => {
        if (!complaintDetails.trim()) return showToast(t.errorEmpty);
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

    // --- CHAT SEND FUNCTION ---
    const sendChatMessage = async () => {
        if (!chatInput.trim() || !user || !appId) return;

        setIsSendingChat(true);
        try {
            const newChatRef = push(ref(db, `artifacts/${appId}/public/data/live_chats/${user.uid}/messages`));
            await set(newChatRef, {
                sender: 'user', // user or admin
                text: chatInput.trim(),
                timestamp: serverTimestamp()
            });
            
            // Update metadata for admin dashboard to see who messaged recently
            const chatMetaRef = ref(db, `artifacts/${appId}/public/data/live_chats/${user.uid}/meta`);
            await set(chatMetaRef, {
                userName: userData.name,
                userId: user.uid,
                lastMessage: chatInput.trim(),
                timestamp: serverTimestamp(),
                unreadByAdmin: true
            });

            setChatInput("");
        } catch (e) {
            showToast(t.errorSubmit);
        } finally {
            setIsSendingChat(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
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
                body { background: var(--bg); color: var(--text-h); padding-bottom: 120px; line-height: 1.6; }

                .container { padding: 18px; max-width: 480px; margin: 0 auto; }
                
                /* Banner & Buttons */
                .support-banner {
                    background: linear-gradient(145deg, #ffffff 0%, #f3e8ff 100%);
                    border: 1px dashed #a855f7; border-radius: 20px;
                    padding: 20px; text-align: center; margin-bottom: 20px;
                    box-shadow: 0 8px 25px rgba(168, 85, 247, 0.08);
                    animation: slideDown 0.4s ease-out;
                }
                .support-banner p { font-size: 0.85rem; font-weight: 700; color: #4c1d95; margin-bottom: 18px; line-height: 1.6; }
                
                .action-buttons { display: flex; gap: 10px; justify-content: center; }
                .tab-btn {
                    flex: 1; padding: 12px 10px; border-radius: 14px; font-weight: 800; border: none; cursor: pointer; font-size: 0.85rem; transition: 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center; gap: 6px;
                }
                .tab-chat { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
                .tab-form { background: white; color: #475569; border: 2px solid #cbd5e1; }
                .tab-chat.active { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); }
                .tab-form.active { border-color: #6366f1; color: #6366f1; background: #e0e7ff; }

                /* Tab Content Container */
                .tab-content { animation: fadeIn 0.3s ease-in-out; }

                /* Live Chat UI */
                .chat-box {
                    background: white; border-radius: 22px; border: 1px solid #e2e8f0; height: 420px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.02);
                }
                .chat-header {
                    background: #f8fafc; padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: 800; font-size: 0.9rem; color: #1e293b; display: flex; align-items: center; gap: 8px;
                }
                .chat-messages {
                    flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #fdfdfd;
                }
                .msg-wrapper { display: flex; flex-direction: column; max-width: 80%; }
                .msg-wrapper.user { align-self: flex-end; }
                .msg-wrapper.admin { align-self: flex-start; }
                
                .msg-bubble { padding: 10px 14px; font-size: 0.85rem; border-radius: 18px; line-height: 1.4; word-wrap: break-word; }
                .msg-wrapper.user .msg-bubble { background: var(--p-gradient); color: white; border-bottom-right-radius: 4px; }
                .msg-wrapper.admin .msg-bubble { background: #f1f5f9; color: #1e293b; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }
                
                .msg-time { font-size: 0.55rem; color: #94a3b8; margin-top: 4px; }
                .msg-wrapper.user .msg-time { text-align: right; }

                .chat-input-area {
                    display: flex; padding: 12px; background: white; border-top: 1px solid #e2e8f0; align-items: center; gap: 10px;
                }
                .chat-input {
                    flex: 1; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 20px; padding: 12px 15px; outline: none; font-size: 0.85rem; transition: 0.3s;
                }
                .chat-input:focus { border-color: #3b82f6; background: white; }
                .btn-send {
                    background: #3b82f6; color: white; border: none; border-radius: 50%; width: 42px; height: 42px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: 0.2s;
                }
                .btn-send:active { transform: scale(0.9); }
                .btn-send:disabled { background: #cbd5e1; cursor: not-allowed; }

                /* Form UI */
                .elite-card { background: white; border-radius: 22px; padding: 20px; margin-bottom: 15px; border: 1px solid #e2e8f0; box-shadow: 0 8px 20px rgba(0,0,0,0.02); }
                .input-group { margin-bottom: 14px; }
                .input-group label { display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-p); margin-bottom: 5px; margin-left: 5px; }
                .input-group select, .input-group textarea { width: 100%; padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 15px; outline: none; font-size: 0.9rem; transition: 0.3s;}
                .input-group select:focus, .input-group textarea:focus { border-color: #6366f1; }
                .btn-elite { width: 100%; padding: 14px; border: none; border-radius: 16px; background: var(--p-gradient); color: white; font-weight: 700; cursor: pointer; box-shadow: var(--p-glow); transition: 0.3s; }
                .btn-elite:active { transform: scale(0.97); }
                .btn-elite:disabled { opacity: 0.7; cursor: not-allowed; }

                /* History UI */
                .complaint-item { background: white; padding: 15px; border-radius: 15px; margin-bottom: 10px; border-left: 4px solid #6366f1; animation: slideUp 0.3s ease-out; box-shadow: 0 2px 8px rgba(0,0,0,0.02);}
                .status-badge { font-size: 0.6rem; padding: 3px 8px; border-radius: 5px; font-weight: 800; float: right; }
                .status-pending { background: #fef3c7; color: #92400e; }
                .status-solved { background: #dcfce7; color: #166534; }
                
                @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 10px 20px; border-radius: 50px; font-size: 0.75rem; z-index: 3000; transition: opacity 0.3s; }
            `}</style>

            {toast.visible && <div id="toast" style={{ display: 'block' }}>{toast.msg}</div>}

            <Header 
                user={user} userData={userData} hasNewNotif={hasNewNotif} 
                openNotifications={openNotifications} currentLang={currentLang} 
                changeLang={changeLang} t={t} router={router} 
            />

            <div className="container">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '15px 0 15px 5px', color: '#1e293b' }}>
                    {t.titleCenter}
                </h3>

                {/* --- SUPPORT BANNER --- */}
                <div className="support-banner">
                    <p>{t.supportGreeting}</p>
                    <div className="action-buttons">
                        <button 
                            className={`tab-btn tab-chat ${activeTab === 'chat' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('chat')}
                        >
                            {t.btnChatAdmin}
                        </button>
                        <button 
                            className={`tab-btn tab-form ${activeTab === 'form' ? 'active' : ''}`} 
                            onClick={() => setActiveTab('form')}
                        >
                            {t.btnSubmitIssue}
                        </button>
                    </div>
                </div>

                {/* --- LIVE CHAT SECTION --- */}
                {activeTab === 'chat' && (
                    <div className="tab-content chat-box">
                        <div className="chat-header">
                            <span style={{ fontSize: '1.2rem' }}>💬</span> Live Support
                        </div>
                        
                        <div className="chat-messages">
                            {chatMessages.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: 'auto', marginBottom: 'auto' }}>
                                    {t.chatEmpty}
                                </div>
                            ) : (
                                chatMessages.map((msg) => (
                                    <div key={msg.id} className={`msg-wrapper ${msg.sender === 'user' ? 'user' : 'admin'}`}>
                                        <div className="msg-bubble">{msg.text}</div>
                                        <div className="msg-time">
                                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="chat-input-area">
                            <input 
                                type="text" 
                                className="chat-input" 
                                placeholder={t.chatInputPlaceholder}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                            />
                            <button 
                                className="btn-send" 
                                onClick={sendChatMessage}
                                disabled={!chatInput.trim() || isSendingChat}
                            >
                                ➢
                            </button>
                        </div>
                    </div>
                )}

                {/* --- COMPLAINT FORM SECTION --- */}
                {activeTab === 'form' && (
                    <div className="tab-content">
                        <div className="elite-card">
                            <div className="input-group">
                                <label>{t.selectPage}</label>
                                <select value={complaintPage} onChange={(e) => setComplaintPage(e.target.value)}>
                                    <option value="Home/Missions">Home / Missions</option>
                                    <option value="Promote">Promote Page</option>
                                    <option value="Profile">Profile Page</option>
                                    <option value="Spin/Bonus">Spin / Daily Bonus</option>
                                    <option value="Payment">Payment/Withdraw</option>
                                    <option value="Other">Other Issues</option>
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
                )}
            </div>

            <Footer 
                navOpen={navOpen} setNavOpen={setNavOpen} view={view} 
                handleSetView={handleSetView} toggleMenu={toggleMenu} t={t} router={router} 
            />
            
            <style>{`
                 .hf-expanded-menu .hf-nav-item:nth-child(2) div { background: #f1f5f9 !important; color: #64748b !important; }
            `}</style>
        </>
    );
}


