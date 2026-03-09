// File Path: app/page.js "important message for gemini ai - this is dashboard"

"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, set, serverTimestamp, get } from 'firebase/database';

// --- SVG ICON COMPONENTS ---
const SvgIcon = ({ children, size = 24, color = "currentColor", className = "", style = {} }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        {children}
    </svg>
);

const IconSpin = (props) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><line x1="14.31" x2="20.05" y1="8" y2="17.94"/><line x1="9.69" x2="21.17" y1="8" y2="8"/><line x1="7.38" x2="12" y1="12" y2="20.66"/><line x1="9.69" x2="3.95" y1="16" y2="6.06"/><line x1="14.31" x2="2.83" y1="16" y2="16"/><line x1="16.62" x2="12" y1="12" y2="3.34"/></SvgIcon>;
const IconGift = (props) => <SvgIcon {...props}><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></SvgIcon>;
const IconOffer = (props) => <SvgIcon {...props}><path d="m3.85 8.62 1.4 1.41a1 1 0 0 1 0 1.41l-1.4 1.41a1 1 0 0 0 0 1.41l1.4 1.41a1 1 0 0 1 0 1.41l-1.4 1.41a1 1 0 0 0 .71 1.71h1.98a1 1 0 0 1 .71.29l1.41 1.4a1 1 0 0 0 1.41 0l1.41-1.4a1 1 0 0 1 .71-.29h1.98a1 1 0 0 0 .71-1.71l-1.4-1.41a1 1 0 0 1 0-1.41l1.4-1.41a1 1 0 0 0 0-1.41l-1.4-1.41a1 1 0 0 1 0-1.41l1.4-1.41a1 1 0 0 0-.71-1.71h-1.98a1 1 0 0 1-.71-.29l-1.41-1.4a1 1 0 0 0-1.41 0l-1.41 1.4a1 1 0 0 1-.71.29H4.56a1 1 0 0 0-.71 1.71Z"/><path d="m9 15 6-6"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/></SvgIcon>;
const IconTrophy = (props) => <SvgIcon {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></SvgIcon>;
const IconSupport = (props) => <SvgIcon {...props}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/><path d="M19 22v-3"/></SvgIcon>;
const IconHome = (props) => <SvgIcon {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></SvgIcon>;
const IconRocket = (props) => <SvgIcon {...props}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></SvgIcon>;
const IconUser = (props) => <SvgIcon {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SvgIcon>;
const IconBell = (props) => <SvgIcon {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></SvgIcon>;
const IconLock = (props) => <SvgIcon {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></SvgIcon>;
const IconArrowRight = (props) => <SvgIcon {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></SvgIcon>;
const IconMenu = (props) => <SvgIcon {...props}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></SvgIcon>;
const IconHandWave = (props) => <SvgIcon {...props}><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/><path d="m8 11-4-4"/></SvgIcon>;
// --- END SVG ICON COMPONENTS ---


// Firebase Config Environment Variable থেকে একটিমাত্র JSON string হিসেবে লোড করা হচ্ছে
let firebaseConfig = {};
try {
    firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
} catch (error) {
    console.error("Firebase config parse error:", error);
}

// Next.js এ একাধিকবার ইনিশিয়ালাইজেশন এড়াতে এই পদ্ধতি
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app); // Realtime Database ব্যবহার করা হচ্ছে
const appId = firebaseConfig.projectId; // JSON থেকে projectId নেওয়া হলো

const translations = {
    bn: {
        authTagline: "প্রিমিয়াম মাইক্রো-টাস্ক প্ল্যাটফর্ম",
        fullName: "সম্পূর্ণ নাম", referCode: "রেফার কোড (ঐচ্ছিক)", email: "ইমেইল অ্যাড্রেস", password: "গোপন পাসওয়ার্ড",
        points: "পয়েন্ট", spin: "লাকি স্পিন", gift: "ডেইলি বোনাস", offers: "স্পেশাল অফার", missions: "উপলব্ধ মিশন",
        directChatText: "সরাসরি এডমিনের সাথে কথা বলতে:", adminSupportBtn: "এডমিন সাপোর্ট (চ্যাট)",
        pageHome: "হোম / মিশন", pagePromote: "প্রমোট পেজ", pageProfile: "প্রোফাইল পেজ", pageSpin: "স্পিন / বোনাস", pagePayment: "পেমেন্ট সমস্যা",
        navMissions: "মিশন", navPromote: "প্রমোট", navChat: "অভিযোগ", navProfile: "প্রোফাইল",
        adminReply: "এডমিনের উত্তর:", statusPending: "পেন্ডিং", statusSolved: "সমাধান হয়েছে", logout: "লগআউট",
        performTask: "কাজটি সম্পন্ন করুন 🔗", missionReward: "মিশন রিওয়ার্ড:", proofLabel: "প্রমাণ (ইউজারনেম/লিঙ্ক)", submitBtn: "সাবমিট করুন", cancelBtn: "বাতিল", backBtn: "পিছনে যান",
        verifyEmailTitle: "ইমেইল ভেরিফাই করুন", verifyEmailMsg: "আমরা আপনার ইমেইলে একটি ভেরিফিকেশন লিঙ্ক পাঠিয়েছি। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।",
        checkVerifyBtn: "ভেরিফিকেশন চেক করুন", resendLinkBtn: "লিঙ্ক পুনরায় পাঠান",
        notifTitle: "সিস্টেম নোটিফিকেশন", noNotif: "নতুন কোন নোটিফিকেশন নেই"
    },
    en: {
        authTagline: "The Premium Micro-Task Platform",
        fullName: "Full Name", referCode: "Refer Code (Optional)", email: "Email Address", password: "Secret Password",
        points: "Points", spin: "Lucky Spin", gift: "Daily Gift", offers: "Special Offer", missions: "Available Missions",
        directChatText: "To talk directly with Admin:", adminSupportBtn: "Admin Support (Chat)",
        pageHome: "Home / Missions", pagePromote: "Promote Page", pageProfile: "Profile Page", pageSpin: "Spin / Bonus", pagePayment: "Payment Issue",
        navMissions: "Missions", navPromote: "Promote", navChat: "Complaint", navProfile: "Profile",
        adminReply: "Admin Reply:", statusPending: "Pending", statusSolved: "Solved", logout: "Logout",
        performTask: "Perform Task 🔗", missionReward: "Mission Reward:", proofLabel: "Proof (Username/Link)", submitBtn: "Submit", cancelBtn: "Cancel", backBtn: "Back",
        verifyEmailTitle: "Verify Your Email", verifyEmailMsg: "We've sent a verification link to your email. Please check your inbox.",
        checkVerifyBtn: "Check Verification Status", resendLinkBtn: "Resend Link",
        notifTitle: "System Notifications", noNotif: "No notifications found"
    }
};

const prizes = [
    { label: "0", color: "#f43f5e" }, { label: "2", color: "#6366f1" },
    { label: "5", color: "#10b981" }, { label: "10", color: "#f59e0b" },
    { label: "20", color: "#a855f7" }, { label: "0", color: "#64748b" },
    { label: "50", color: "#ec4899" }, { label: "5", color: "#06b6d4" }
];

export default function TaskBazarApp() {
    const router = useRouter(); 

    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ points: 0, name: "User", avatar: "" });
    const [currentLang, setCurrentLang] = useState('bn');
    const [view, setView] = useState('list-view');
    const [navOpen, setNavOpen] = useState(false);

    // State for Data
    const [systemNotice, setSystemNotice] = useState("");
    const [tasks, setTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [hasNewNotif, setHasNewNotif] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);

    // UI State
    const [toast, setToast] = useState({ msg: "", visible: false });
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [proofInput, setProofInput] = useState("");
    const [isSpinning, setIsSpinning] = useState(false);

    // Refs
    const wheelRef = useRef(null);
    const canvasRef = useRef(null);
    const chatBoxRef = useRef(null);
    const authPopupTimer = useRef(null);

    const t = translations[currentLang];

    // Hydration fix & Init
    useEffect(() => {
        const savedLang = localStorage.getItem('elite_lang') || 'bn';
        setCurrentLang(savedLang);
        const lastView = localStorage.getItem('last_view') || 'list-view';
        setView(lastView);

        // Auth Listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && currentUser.emailVerified) {
                setUser(currentUser);
                localStorage.setItem('isLoggedIn', 'true');
                setShowAuthPopup(false);
                clearTimeout(authPopupTimer.current);
            } else {
                setUser(null);
                localStorage.removeItem('isLoggedIn');
                triggerAuthPopup();
            }
        });

        loadSystemNotice();

        return () => unsubscribe();
    }, []);

    // Change View logic
    const handleSetView = (newView) => {
        setView(newView);
        localStorage.setItem('last_view', newView);
        if (newView === 'spin-view') {
            setTimeout(drawWheel, 100);
        }
    };

    // Require Auth Helper
    const requireAuth = () => {
        if (!user) {
            triggerAuthPopup();
            return false;
        }
        return true;
    };

    const triggerAuthPopup = () => {
        setShowAuthPopup(true);
    };

    const handleHideAuthPopup = () => {
        setShowAuthPopup(false);
        clearTimeout(authPopupTimer.current);
        authPopupTimer.current = setTimeout(triggerAuthPopup, 60000); // 1 minute
    };

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast({ msg: "", visible: false }), 3000);
    };

    const toggleMenu = () => setNavOpen(!navOpen);

    const changeLang = (lang) => {
        setCurrentLang(lang);
        localStorage.setItem('elite_lang', lang);
    };

    // Load Realtime Data
    useEffect(() => {
        if (!user || !appId) return;

        // Sync User Data (Realtime Database)
        const statsRef = ref(db, `artifacts/${appId}/users/${user.uid}/stats`);
        const unsubStats = onValue(statsRef, (snap) => {
            const data = snap.val() || {};
            setUserData({
                points: data.points || 0,
                name: data.name || "User",
                avatar: data.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            });
            localStorage.setItem('user_cache_data', JSON.stringify(data));
        });

        // Notifications (Realtime Database)
        const pubNotifRef = ref(db, `artifacts/${appId}/public/notifications`);
        const pvtNotifRef = ref(db, `artifacts/${appId}/users/${user.uid}/notifications`);

        const lastChecked = parseInt(localStorage.getItem('last_notif_check') || "0");

        const fetchNotifs = async () => {
            try {
                const [pubSnap, pvtSnap] = await Promise.all([get(pubNotifRef), get(pvtNotifRef)]);
                const pubs = pubSnap.val() || {};
                const pvts = pvtSnap.val() || {};
                const combined = [];
                Object.keys(pubs).forEach(id => combined.push({...pubs[id], id, scope: 'public'}));
                Object.keys(pvts).forEach(id => combined.push({...pvts[id], id, scope: 'private'}));
                combined.sort((a,b) => b.timestamp - a.timestamp);

                setNotifications(combined);
                const hasNew = combined.some(n => n.timestamp > lastChecked);
                setHasNewNotif(hasNew);
            } catch (err) { console.error(err); }
        };

        const unsubPubNotif = onValue(pubNotifRef, fetchNotifs);
        const unsubPvtNotif = onValue(pvtNotifRef, fetchNotifs);

        // Chat (Realtime Database)
        const chatRef = ref(db, `artifacts/${appId}/support/${user.uid}/messages`);
        const unsubChat = onValue(chatRef, (snap) => {
            const msgs = snap.val() || {};
            const msgArray = Object.keys(msgs).map(k => msgs[k]);
            setChatMessages(msgArray);
            if(chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        });

        return () => {
            unsubStats(); unsubPubNotif(); unsubPvtNotif(); unsubChat();
        };
    }, [user]);

    // Load Tasks (Realtime Database)
    useEffect(() => {
        if (!appId) return;

        const tasksRef = ref(db, `artifacts/${appId}/public/data/microtasks`);
        const subsRef = ref(db, `artifacts/${appId}/public/data/submissions`);

        const handleTasks = async () => {
            try {
                const [taskSnap, subSnap] = await Promise.all([get(tasksRef), get(subsRef)]);
                const tks = taskSnap.val() || {};
                const sbs = subSnap.val() || {};

                const loadedTasks = [];
                Object.keys(tks).reverse().forEach(id => {
                    const item = tks[id];
                    if (user && item.creatorId === user.uid) return;

                    let mySubStatus = null;
                    if (user && sbs[id]) {
                        Object.keys(sbs[id]).forEach(sId => {
                            if (sbs[id][sId].userId === user.uid) mySubStatus = sbs[id][sId].status;
                        });
                    }

                    if (mySubStatus === 'approved' || mySubStatus === 'rejected') return;
                    loadedTasks.push({ ...item, id, isPending: mySubStatus === 'pending' });
                });
                setTasks(loadedTasks);
            } catch (error) { console.error(error); }
        };

        const unsubTasks = onValue(tasksRef, handleTasks);
        const unsubSubs = onValue(subsRef, handleTasks);

        return () => { unsubTasks(); unsubSubs(); };
    }, [user]);

    const loadSystemNotice = () => {
        if (!appId) return;
        const noticeRef = ref(db, `artifacts/${appId}/public/settings/notice`);
        onValue(noticeRef, (s) => {
            setSystemNotice(s.val() || "");
        });
    };

    const openNotifications = () => {
        if (!requireAuth()) return;
        localStorage.setItem('last_notif_check', Date.now().toString());
        setHasNewNotif(false);
        handleSetView('notification-view');
    };

    const openTaskDetails = (task) => {
        if (!requireAuth()) return;
        setSelectedTask(task);
        handleSetView('detail-view');
    };

    const submitProof = async () => {
        if (!requireAuth()) return;
        if (!proofInput.trim()) return showToast("Proof required!");

        try {
            const subRef = ref(db, `artifacts/${appId}/public/data/submissions/${selectedTask.id}/${Date.now()}`);
            await set(subRef, {
                userId: user.uid,
                proof: proofInput.trim(),
                status: 'pending',
                timestamp: serverTimestamp()
            });
            setProofInput("");
            showToast("Submitted!");
            handleSetView('list-view');
        } catch (err) { showToast("Error submitting proof"); }
    };

    const claimDailyBonus = async () => {
        if (!requireAuth()) return;
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/daily-bonus', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (!response.ok) return showToast(data.error || "Something went wrong!");
            showToast(data.message);
        } catch (error) { showToast("Network Error!"); }
    };

    const sendChatMessage = async () => {
        if (!requireAuth()) return;
        if (!chatInput.trim()) return;

        try {
            const msgRef = ref(db, `artifacts/${appId}/support/${user.uid}/messages/${Date.now()}`);
            await set(msgRef, { text: chatInput.trim(), role: 'user', timestamp: serverTimestamp() });

            const listRef = ref(db, `artifacts/${appId}/support_list/${user.uid}`);
            await set(listRef, { lastMsg: chatInput.trim(), name: userData.name, timestamp: serverTimestamp() });

            setChatInput("");
        } catch (err) { showToast("Error sending message"); }
    };

    const drawWheel = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2;
        const sliceAngle = (2 * Math.PI) / prizes.length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        prizes.forEach((prize, i) => {
            const angle = i * sliceAngle;
            ctx.beginPath();
            ctx.fillStyle = prize.color;
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
            ctx.fill();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle + sliceAngle / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "white";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText(prize.label, radius - 20, 5);
            ctx.restore();
        });
    };

    const enhancedSpinWheel = async () => {
        if (!requireAuth() || isSpinning) return;
        if (userData.points < 5) return showToast("Low points! Need at least 5 points.");

        setIsSpinning(true);

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/spin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            if (!response.ok) {
                showToast(data.error || "Server Error!");
                setIsSpinning(false);
                return;
            }

            const sliceSize = 360 / prizes.length;
            const targetRotation = 270 - (data.prizeIndex * sliceSize) - (sliceSize / 2);
            const randomSpins = 360 * 5; 
            const totalSpin = randomSpins + targetRotation;

            if (wheelRef.current) {
                wheelRef.current.style.transform = `rotate(${totalSpin}deg)`;
            }

            setTimeout(() => {
                showToast(data.winAmount > 0 ? `Won ${data.winAmount} Points!` : "Try again.");
                setIsSpinning(false);

                if (wheelRef.current) {
                    const netRotation = totalSpin % 360;
                    wheelRef.current.style.transition = 'none';
                    wheelRef.current.style.transform = `rotate(${netRotation}deg)`;
                    setTimeout(() => { 
                        if (wheelRef.current) wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.1, 0, 0, 1)'; 
                    }, 50);
                }
            }, 4000);

        } catch (error) {
            showToast("Network Error!");
            setIsSpinning(false);
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
                    --accent: #10b981;
                    --danger: #f43f5e;
                    --warning: #f59e0b;
                }

                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
                body { background: var(--bg); color: var(--text-h); line-height: 1.6; padding-bottom: 90px; overflow-x: hidden; }

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

                .header-lang-switch {
                    display: flex; background: rgba(0,0,0,0.1); padding: 3px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15);
                }
                .h-lang-btn {
                    padding: 4px 8px; font-size: 0.55rem; font-weight: 800; border-radius: 8px; cursor: pointer; transition: 0.3s; color: rgba(255,255,255,0.6);
                }
                .h-lang-btn.active { background: white; color: #6366f1; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

                .wallet-pill {
                    background: rgba(255,255,255,0.15); backdrop-filter: blur(15px); padding: 5px 10px;
                    border-radius: 14px; border: 1px solid rgba(255,255,255,0.25); text-align: right; flex-shrink: 0;
                }
                .wallet-pill span { font-size: 0.45rem; text-transform: uppercase; font-weight: 800; opacity: 0.8; display: block; line-height: 1; }
                .wallet-pill b { display: block; font-size: 0.95rem; font-weight: 800; line-height: 1.2; }

                .notif-btn { position: relative; background: rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 1.1rem; cursor: pointer; }
                .notif-badge { position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background: var(--danger); border-radius: 50%; border: 2px solid white; }

                .container { padding: 0 18px; margin-top: -8px; max-width: 480px; margin-left: auto; margin-right: auto; }
                .view { animation: viewIn 0.4s ease-out; }
                @keyframes viewIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                .elite-card {
                    background: var(--glass); backdrop-filter: blur(20px); border-radius: 22px; padding: 18px;
                    margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.7);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.02); transition: 0.3s;
                }
                .section-h { font-size: 1rem; font-weight: 800; margin: 15px 0 10px 5px; color: #1e293b; }

                .btn-elite {
                    width: 100%; padding: 14px; border: none; border-radius: 16px;
                    background: var(--p-gradient); color: white; font-size: 0.9rem; font-weight: 700;
                    cursor: pointer; transition: 0.3s; box-shadow: var(--p-glow);
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .btn-elite:active { transform: scale(0.97); }
                .btn-elite:disabled { opacity: 0.7; cursor: not-allowed; transform: none; box-shadow: none; }
                .btn-ghost { background: #f1f5f9; color: var(--text-p); box-shadow: none; margin-top: 10px; }

                .nav-bar-container {
                    position: fixed; bottom: 15px; left: 15px; right: 15px;
                    z-index: 1000; display: flex; flex-direction: column; gap: 10px;
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
                }
                .nav-item { display: flex; flex-direction: column; align-items: center; color: #94a3b8; cursor: pointer; text-decoration: none; transition: 0.3s; }
                .nav-item.active { color: #6366f1; transform: translateY(-2px); }
                .nav-item i { display: flex; align-items: center; justify-content: center; margin-bottom: 2px; }
                .nav-item span { font-size: 0.55rem; font-weight: 700; white-space: nowrap; }

                .input-group { margin-bottom: 14px; }
                .input-group label { display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-p); margin-bottom: 5px; margin-left: 5px; }
                .input-group input, .input-group select, .input-group textarea {
                    width: 100%; padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0;
                    border-radius: 15px; outline: none; transition: 0.3s; font-size: 0.9rem;
                }

                #toast {
                    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                    background: #1e293b; color: white; padding: 10px 20px; border-radius: 50px;
                    font-size: 0.75rem; font-weight: 600; z-index: 3000; box-shadow: 0 8px 15px rgba(0,0,0,0.15);
                    transition: opacity 0.3s ease;
                }

                .chat-container { height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 5px; }
                .bubble { padding: 10px 14px; border-radius: 15px; font-size: 0.8rem; max-width: 80%; font-weight: 500; }
                .bubble-me { background: var(--p-gradient); color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
                .bubble-admin { background: #f1f5f9; color: var(--text-h); align-self: flex-start; border-bottom-left-radius: 4px; }

                .notif-card { background: white; padding: 15px; border-radius: 18px; margin-bottom: 12px; border-left: 5px solid #6366f1; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
                .notif-card h4 { font-size: 0.85rem; font-weight: 800; color: #1e293b; }
                .notif-card p { font-size: 0.75rem; color: #64748b; margin-top: 5px; }
                .notif-card small { font-size: 0.6rem; color: #94a3b8; display: block; margin-top: 8px; font-weight: 700; }
                
                .pending-task { opacity: 0.7; cursor: default; }
            `}</style>

            {/* Toast */}
            {toast.visible && <div id="toast">{toast.msg}</div>}

            {/* Auth Popup */}
            {showAuthPopup && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="elite-card" style={{ width: '90%', maxWidth: '360px', textAlign: 'center', animation: 'viewIn 0.3s ease-out', background: 'white', padding: '30px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                            <IconHandWave size={48} color="#6366f1" />
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#0f172a', marginBottom: '8px' }}>অ্যাকাউন্ট প্রয়োজন!</h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '25px' }}>সকল ফিচার ব্যবহার করতে এবং আয় শুরু করতে দয়া করে লগইন বা সাইন আপ করুন।</p>
                        <button className="btn-elite" onClick={() => router.push('/login')}>লগইন / সাইন আপ</button>
                        <button className="btn-elite btn-ghost" onClick={handleHideAuthPopup}>পরে করব</button>
                    </div>
                </div>
            )}

            {/* Main App Container */}
            <div>
                {/* Header */}
                <div className="header">
                    <div className="header-content">
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="avatar-frame" onClick={() => router.push('/profile')}>
                                    <img src={userData.avatar} onError={(e) => {e.target.src="https://cdn-icons-png.flaticon.com/512/149/149071.png"}} alt="Avatar"/>
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '0.75rem', fontWeight: 800 }}>{userData.name}</h2>
                                    <span style={{ fontSize: '0.45rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '6px' }}>PRO</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <button onClick={() => router.push('/login')} style={{ background: 'white', color: '#6366f1', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: '0.3s' }}>Login</button>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="notif-btn" onClick={openNotifications}>
                                <IconBell size={20} />
                                {hasNewNotif && <div className="notif-badge"></div>}
                            </div>
                            <div className="header-lang-switch">
                                <div className={`h-lang-btn ${currentLang === 'bn' ? 'active' : ''}`} onClick={() => changeLang('bn')}>BN</div>
                                <div className={`h-lang-btn ${currentLang === 'en' ? 'active' : ''}`} onClick={() => changeLang('en')}>EN</div>
                            </div>
                            <div className="wallet-pill">
                                <span>{t.points}</span>
                                <b>{userData.points}</b>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Container */}
                <div className="container">

                    {/* List View */}
                    {view === 'list-view' && (
                        <div className="view">
                            {systemNotice && (
                                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '10px', borderRadius: '15px', marginTop: '20px', color: '#9a3412', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <marquee>{systemNotice}</marquee>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px' }}>
                                <div className="elite-card" style={{ padding: '12px 5px', textAlign: 'center', cursor: 'pointer', marginBottom: 0 }} onClick={() => handleSetView('spin-view')}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                        <IconSpin size={28} color="#6366f1" />
                                    </div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6366f1' }}>{t.spin}</p>
                                </div>
                                <div className="elite-card" style={{ padding: '12px 5px', textAlign: 'center', cursor: 'pointer', marginBottom: 0 }} onClick={claimDailyBonus}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                        <IconGift size={28} color="#10b981" />
                                    </div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981' }}>{t.gift}</p>
                                </div>
                                <div className="elite-card" style={{ padding: '12px 5px', textAlign: 'center', cursor: 'pointer', marginBottom: 0, border: '1.5px dashed #f59e0b', background: '#fffbeb' }} onClick={() => router.push('/specialoffers')}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                        <IconOffer size={28} color="#d97706" />
                                    </div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#d97706' }}>{t.offers}</p>
                                </div>
                            </div>

                            <h3 className="section-h">{t.missions}</h3>
                            <div>
                                {tasks.map(task => (
                                    <div key={task.id} className={`elite-card ${task.isPending ? 'pending-task' : ''}`} onClick={() => !task.isPending && openTaskDetails(task)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>{task.title}</h4>
                                            <p style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem' }}>+{task.reward} {t.points}</p>
                                        </div>
                                        <div style={{ background: '#f1f5f9', width: '30px', height: '30px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {task.isPending ? <IconLock size={16} color="#94a3b8" /> : <IconArrowRight size={16} color="#6366f1" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notification View */}
                    {view === 'notification-view' && (
                        <div className="view">
                            <h3 className="section-h">{t.notifTitle}</h3>
                            <div style={{ marginTop: '10px' }}>
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div key={n.id} className="notif-card" style={n.scope === 'private' ? { borderLeft: '5px solid #f59e0b', background: '#fffbeb' } : {}}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>{n.title}</h4>
                                            <span style={{ fontSize: '0.5rem', padding: '2px 6px', borderRadius: '5px', background: n.scope === 'private' ? '#fef3c7' : '#eef2ff', color: n.scope === 'private' ? '#92400e' : '#4338ca', fontWeight: 800, border: '1px solid rgba(0,0,0,0.05)' }}>
                                                {n.scope === 'private' ? 'PRIVATE' : 'PUBLIC'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '5px' }}>{n.message}</p>
                                        <small style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block', marginTop: '8px' }}>{new Date(n.timestamp).toLocaleString()}</small>
                                    </div>
                                )) : <p style={{ textAlign: 'center', padding: '20px', fontSize: '0.8rem', color: 'var(--text-p)' }}>{t.noNotif}</p>}
                            </div>
                            <button className="btn-elite btn-ghost" onClick={() => handleSetView('list-view')} style={{ marginTop: '15px' }}>{t.backBtn}</button>
                        </div>
                    )}

                    {/* Support View */}
                    {view === 'support-view' && (
                        <div className="view">
                            <h3 className="section-h">Support Chat</h3>
                            <div className="elite-card">
                                <div className="chat-container" ref={chatBoxRef}>
                                    {chatMessages.map((m, i) => (
                                        <div key={i} className={`bubble ${m.role === 'admin' ? 'bubble-admin' : 'bubble-me'}`}>
                                            {m.text}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." style={{ flex: 1, padding: '12px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.85rem' }} />
                                    <button className="btn-elite" onClick={sendChatMessage} style={{ width: '45px', padding: 0, height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <IconArrowRight size={20} color="white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detail View */}
                    {view === 'detail-view' && selectedTask && (
                        <div className="view">
                            <div className="elite-card" style={{ marginTop: '30px' }}>
                                <div>
                                    <h3 style={{ fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>{selectedTask.title}</h3>
                                    <span style={{ background: '#f0fdf4', color: '#10b981', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem' }}>{t.missionReward} {selectedTask.reward}</span>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '15px 0' }}>নির্দেশনা অনুসরণ করে মিশনটি সম্পন্ন করুন।</p>
                                    <a href={selectedTask.link} target="_blank" rel="noreferrer" className="btn-elite" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: '12px', background: '#f1f5f9', color: '#6366f1', boxShadow: 'none' }}>{t.performTask}</a>
                                </div>
                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                                    <div className="input-group">
                                        <label>{t.proofLabel}</label>
                                        <textarea value={proofInput} onChange={(e) => setProofInput(e.target.value)} rows={2} placeholder="প্রমাণ হিসেবে আপনার ইউজারনেম বা আইডি দিন"></textarea>
                                    </div>
                                    <button className="btn-elite" onClick={submitProof}>{t.submitBtn}</button>
                                    <button className="btn-elite btn-ghost" onClick={() => handleSetView('list-view')}>{t.cancelBtn}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Spin View */}
                    {view === 'spin-view' && (
                        <div className="view">
                            <h3 className="section-h">{t.spin}</h3>
                            <div className="elite-card" style={{ textAlign: 'center', padding: '30px 20px', position: 'relative' }}>
                                <div style={{ position: 'relative', width: '260px', height: '260px', margin: '0 auto 30px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <div ref={wheelRef} style={{ width: '100%', height: '100%', borderRadius: '50%', border: '8px solid #f1f5f9', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', transition: 'transform 4s cubic-bezier(0.1, 0, 0, 1)' }}>
                                        <canvas ref={canvasRef} width="260" height="260"></canvas>
                                    </div>
                                    <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderTop: '25px solid #6366f1', zIndex: 10 }}></div>
                                    <div style={{ position: 'absolute', width: '40px', height: '40px', background: 'white', borderRadius: '50%', boxShadow: '0 0 10px rgba(0,0,0,0.2)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#6366f1', border: '3px solid #6366f1' }}>WIN</div>
                                </div>
                                <button className="btn-elite" onClick={enhancedSpinWheel} disabled={isSpinning}>Spin for 5 Points</button>
                                <button className="btn-elite btn-ghost" onClick={() => handleSetView('list-view')}>{t.backBtn}</button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer NavBar */}
                <div className={`nav-bar-container ${navOpen ? 'open' : ''}`}>
                    <div className="expanded-menu">
                        <div onClick={() => router.push('/leaderboard')} className="nav-item">
                            <div style={{ background: '#fdf2f8', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                                <IconTrophy size={18} color="#ec4899" />
                            </div>
                            <span style={{ fontSize: '0.6rem' }}>Leaderboard</span>
                        </div>
                        <div onClick={() => { handleSetView('support-view'); setNavOpen(false); }} className="nav-item">
                            <div style={{ background: '#f1f5f9', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                                <IconSupport size={18} color="#64748b" />
                            </div>
                            <span style={{ fontSize: '0.6rem' }}>Support</span>
                        </div>
                    </div>

                    <div className="nav-bar">
                        <div className={`nav-item ${view === 'list-view' ? 'active' : ''}`} onClick={() => handleSetView('list-view')}>
                            <i><IconHome size={22} /></i>
                            <span>{t.navMissions}</span>
                        </div>
                        <div className="nav-item" onClick={() => router.push('/order')}>
                            <i><IconRocket size={22} /></i>
                            <span>{t.navPromote}</span>
                        </div>
                        <div className="nav-item" onClick={() => router.push('/profile')}>
                            <i><IconUser size={22} /></i>
                            <span>{t.navProfile}</span>
                        </div>
                        <div className="nav-item" onClick={toggleMenu}>
                            <i>
                                <div style={{ transition: '0.3s', transform: navOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                    <IconMenu size={22} />
                                </div>
                            </i>
                            <span>Menu</span>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}


