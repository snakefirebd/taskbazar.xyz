"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, set, update, serverTimestamp } from 'firebase/database';

// Import Header and Footer from headfoot.js
import { Header, Footer } from '../../components/headfoot';

// Firebase Config
let firebaseConfig = {};
try {
    firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
} catch (error) {
    console.error("Firebase config parse error:", error);
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app); // Realtime Database
const appId = firebaseConfig.projectId;
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const translations = {
    bn: {
        points: "পয়েন্ট", 
        pageTitle: "স্পেশাল অফার", 
        freeBadge: "100% Free",
        offerTitle: "৫০০ ফেসবুক ফলোয়ার", 
        offerDesc: "নতুন ইউজারদের জন্য একদম ফ্রি!",
        linkLabel: "আপনার ফেসবুক লিংক দিন", 
        claimBtn: "ক্লেইম করুন 🚀", 
        processingText: "প্রসেসিং...",
        errorLogin: "প্রথমে লগইন করুন!", 
        errorLink: "দয়া করে সঠিক ফেসবুক লিংক দিন!",
        errorServer: "সমস্যা হয়েছে, আবার চেষ্টা করুন।", 
        successToast: "আপনার টাস্কটি লাইভ হয়েছে। 🎉",
        claimedText: "ক্লেইমড ✅"
    },
    en: {
        points: "Points", 
        pageTitle: "Special Offers", 
        freeBadge: "100% Free",
        offerTitle: "500 Facebook Followers", 
        offerDesc: "Completely free for new users!",
        linkLabel: "Enter your Facebook link", 
        claimBtn: "Claim Now 🚀", 
        processingText: "Processing...",
        errorLogin: "Please login first!", 
        errorLink: "Please enter a valid link!",
        errorServer: "Something went wrong, try again.", 
        successToast: "Your task is live. 🎉",
        claimedText: "Claimed ✅"
    }
};

export default function SpecialOffersPage() {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ points: 0, name: "Member", avatar: defaultAvatar });
    const [currentLang, setCurrentLang] = useState('bn');

    const [toast, setToast] = useState({ msg: "", visible: false });
    const [navOpen, setNavOpen] = useState(false);
    const [view, setView] = useState('list-view');
    const [hasNewNotif, setHasNewNotif] = useState(false);

    const [fbLink, setFbLink] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isClaimed, setIsClaimed] = useState(false);

    const t = translations[currentLang];

    // ==========================================
    // Monetag Ad Setup
    // ==========================================
    const MONETAG_DIRECT_LINK = "https://omg10.com/4/10701785"; 
    const MONETAG_SCRIPT_URL = "https://quge5.com/88/tag.min.js"; 
    
    useEffect(() => {
        // Monetag Multitag / Vignette Script Inject করা হচ্ছে
        const script = document.createElement('script');
        script.src = MONETAG_SCRIPT_URL;
        script.async = true;
        
        // এখানে data-zone টি যুক্ত করা হয়েছে, যা আগে ছিল না
        script.setAttribute('data-zone', '217755'); 
        script.setAttribute('data-cfasync', 'false'); 
        
        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);
    // ==========================================

    const changeLang = (lang) => {
        setCurrentLang(lang);
        localStorage.setItem('elite_lang', lang);
    };
    const toggleMenu = () => setNavOpen(!navOpen);
    const handleSetView = (newView) => setView(newView);
    const openNotifications = () => console.log("Open Notifications");

    useEffect(() => {
        const savedLang = localStorage.getItem('elite_lang') || 'bn';
        setCurrentLang(savedLang);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && appId) {
                setUser(currentUser);

                const statsRef = ref(db, `artifacts/${appId}/users/${currentUser.uid}/stats`);
                onValue(statsRef, (snap) => {
                    const d = snap.val() || {};
                    setUserData({
                        points: d.points || 0,
                        name: d.name || "Member",
                        avatar: (d.avatar && d.avatar !== "null" && d.avatar !== "undefined") ? d.avatar : defaultAvatar
                    });

                    if (d.claimedFreeFbFollowers === true) {
                        setIsClaimed(true);
                    }
                });
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast({ msg: "", visible: false }), 3000);
    };

    const claimOffer = async () => {
        if (!user || !appId) return showToast(t.errorLogin);

        const linkInput = fbLink.trim();
        const isValidFbLink = linkInput.includes('facebook.com') && linkInput.length > 15;

        if (!linkInput || !isValidFbLink) {
            return showToast(t.errorLink);
        }

        // --- Monetag Direct Link Open (High CPM) ---
        if (MONETAG_DIRECT_LINK) {
            window.open(MONETAG_DIRECT_LINK, '_blank', 'noopener,noreferrer');
        }

        setIsLoading(true);

        try {
            const taskId = "task_" + Date.now();
            const taskRef = ref(db, `artifacts/${appId}/public/data/microtasks/${taskId}`);
            
            await set(taskRef, {
                title: "Facebook Follow (Special Offer)",
                type: "Facebook Follow",
                link: linkInput,
                reward: 2, 
                qty: 500,  
                creatorId: user.uid,
                isSpecialOffer: true, 
                timestamp: serverTimestamp()
            });

            const userStatsRef = ref(db, `artifacts/${appId}/users/${user.uid}/stats`);
            await update(userStatsRef, {
                claimedFreeFbFollowers: true
            });

            showToast(t.successToast);
            setIsClaimed(true);

        } catch (error) {
            showToast(t.errorServer);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
                :root { --bg: #f8fafc; --text-h: #0f172a; --text-p: #64748b; }
                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
                body { background: var(--bg); color: var(--text-h); line-height: 1.6; padding-bottom: 120px; overflow-x: hidden; }
                .container { padding: 0 18px; max-width: 480px; margin: 20px auto 0; }
                .section-h { font-size: 1.05rem; font-weight: 800; margin: 0 0 15px 5px; color: #1e293b; display: flex; align-items: center; gap: 8px;}
                
                .offer-card { 
                    background: linear-gradient(145deg, #ffffff 0%, #fffbeb 100%);
                    border-radius: 18px; padding: 22px 18px; 
                    border: 1px solid rgba(245, 158, 11, 0.25); 
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.04), inset 0 2px 0 rgba(255,255,255,0.8);
                    position: relative; overflow: hidden; margin-bottom: 20px;
                    animation: slideUp 0.4s ease forwards; text-align: center;
                }
                .offer-card.claimed {
                    border-color: rgba(16, 185, 129, 0.4);
                    background: linear-gradient(145deg, #ffffff 0%, #ecfdf5 100%);
                }
                @keyframes slideUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                
                .offer-badge {
                    position: absolute; top: 12px; right: -28px; background: #f43f5e; color: white;
                    padding: 4px 30px; font-size: 0.65rem; font-weight: 800; transform: rotate(45deg);
                    box-shadow: 0 2px 8px rgba(244, 63, 94, 0.25); text-transform: uppercase;
                }
                .offer-icon {
                    width: 55px; height: 55px; background: white; color: #f59e0b; border-radius: 16px;
                    display: flex; align-items: center; justify-content: center; font-size: 1.8rem;
                    margin: 0 auto 12px; border: 1px solid #fde68a; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.12);
                }
                .offer-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
                .offer-desc { 
                    font-size: 0.8rem; color: #059669; font-weight: 800; margin-bottom: 18px; 
                    background: rgba(16, 185, 129, 0.1); display: inline-block; 
                    padding: 4px 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2); 
                }
                .input-group { margin-bottom: 18px; text-align: left; }
                .input-group label { display: block; font-size: 0.7rem; font-weight: 800; color: #475569; margin-bottom: 6px; margin-left: 4px; }
                .input-group input { 
                    width: 100%; padding: 12px 15px; background: white; 
                    border: 1px solid #cbd5e1; border-radius: 12px; outline: none; font-size: 0.85rem; font-weight: 600;
                }
                .input-group input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15); }
                
                .btn-offer { 
                    width: 100%; padding: 12px; border: none; border-radius: 12px; 
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; font-size: 0.9rem; 
                    font-weight: 800; cursor: pointer; box-shadow: 0 6px 15px rgba(245, 158, 11, 0.25); 
                    display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease;
                }
                .btn-offer:active { transform: scale(0.97); }
                .btn-offer:disabled, .btn-offer.claimed-btn { 
                    background: #10b981; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); cursor: not-allowed; color: white; 
                }
                .spinner {
                    display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); 
                    border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                #toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 10px 20px; border-radius: 50px; font-size: 0.75rem; font-weight: 700; z-index: 4000; box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
            `}</style>

            {toast.visible && <div id="toast">{toast.msg}</div>}

            <Header 
                user={user} userData={userData} hasNewNotif={hasNewNotif} 
                openNotifications={openNotifications} currentLang={currentLang} 
                changeLang={changeLang} t={t} router={router} 
            />

            <div className="container">
                <h3 className="section-h">
                    <span style={{ fontSize: '1.3rem' }}>🎁</span> <span>{t.pageTitle}</span>
                </h3>

                <div className={`offer-card ${isClaimed ? 'claimed' : ''}`}>
                    <div className="offer-badge">{t.freeBadge}</div>
                    <div className="offer-icon">👥</div>
                    <h2 className="offer-title">{t.offerTitle}</h2>
                    <p className="offer-desc">{t.offerDesc}</p>

                    <div>
                        {!isClaimed && (
                            <div className="input-group">
                                <label>{t.linkLabel}</label>
                                <input 
                                    type="url" value={fbLink} onChange={(e) => setFbLink(e.target.value)}
                                    placeholder="https://facebook.com/..." autoComplete="off"
                                />
                            </div>
                        )}
                        <button 
                            className={`btn-offer ${isClaimed ? 'claimed-btn' : ''}`} 
                            onClick={claimOffer}
                            disabled={isLoading || isClaimed}
                        >
                            {isLoading ? (
                                <><span className="spinner"></span> <span style={{ marginLeft: '5px' }}>{t.processingText}</span></>
                            ) : (
                                <span>{isClaimed ? t.claimedText : t.claimBtn}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <Footer 
                navOpen={navOpen} setNavOpen={setNavOpen} view={view} 
                handleSetView={handleSetView} toggleMenu={toggleMenu} t={t} router={router} 
            />
        </>
    );
}


