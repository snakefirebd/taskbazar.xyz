// File Path: app/leaderboard/page.js "important message for gemini ai"

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, query, orderByChild, limitToLast, onValue } from 'firebase/database'; // Query ইম্পোর্ট করা হয়েছে

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
        title: "🏆 লিডারবোর্ড",
        subtitle: "সর্বোচ্চ পয়েন্ট অর্জনকারী সেরা ইউজারগণ",
        loading: "র‍্যাঙ্কিং লোড হচ্ছে...",
        noUsers: "এখনো কোনো ইউজার নেই!",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu"
    },
    en: {
        points: "Points",
        title: "🏆 Leaderboard",
        subtitle: "Top users with the highest points",
        loading: "Loading rankings...",
        noUsers: "No users found yet!",
        navMissions: "Missions",
        navPromote: "Promote",
        navProfile: "Profile",
        navLeaderboard: "Leaderboard",
        navSupport: "Support",
        navMenu: "Menu"
    }
};

export default function LeaderboardPage() {
    const router = useRouter();

    // States
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ points: 0, name: "Member", avatar: defaultAvatar });
    const [currentLang, setCurrentLang] = useState('bn');
    const [navOpen, setNavOpen] = useState(false);

    // Leaderboard Data
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const t = translations[currentLang];

    // Fetch Auth & Current User Data
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
                });
            } else if (!currentUser) {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Fetch Only Top 50 Users for Leaderboard
    useEffect(() => {
        if (!appId) return;

        // Query: users নোড থেকে stats/points এর ভিত্তিতে শেষ ৫০ জন (অর্থাৎ সর্বোচ্চ পয়েন্টধারী) কে আনা হচ্ছে
        const topUsersQuery = query(
            ref(db, `artifacts/${appId}/users`), 
            orderByChild('stats/points'), 
            limitToLast(50)
        );

        const unsubscribe = onValue(topUsersQuery, (snapshot) => {
            const list = [];
            
            // forEach ব্যবহার করা হয়েছে যাতে ফায়ারবেসের পাঠানো অর্ডার (ছোট থেকে বড়) ঠিক থাকে
            snapshot.forEach((childSnapshot) => {
                const uid = childSnapshot.key;
                const stats = childSnapshot.val().stats || {};
                
                // Filter out empty or basic default names with 0 points
                if (stats.points > 0 || (stats.name && stats.name !== 'Google User')) {
                    list.push({
                        uid,
                        name: stats.name || 'Member',
                        points: stats.points || 0,
                        avatar: (stats.avatar && stats.avatar !== "null" && stats.avatar !== "undefined") ? stats.avatar : defaultAvatar
                    });
                }
            });

            // Firebase 'limitToLast' ছোট থেকে বড় (Ascending) অর্ডারে ডাটা দেয়, তাই বড় থেকে ছোট (Descending) করার জন্য reverse করা হলো।
            list.reverse();
            
            setLeaderboardData(list); 
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const changeLang = (lang) => {
        setCurrentLang(lang);
        localStorage.setItem('elite_lang', lang);
    };

    // Slicing top 3 and the rest
    const TopThree = leaderboardData.slice(0, 3);
    const RestList = leaderboardData.slice(3);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
                
                :root {
                    --p-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    --bg: #f8fafc;
                    --text-h: #0f172a;
                    --text-p: #64748b;
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

                /* Container & Podium */
                .container { padding: 18px; max-width: 480px; margin: 0 auto; animation: fadeUp 0.5s ease forwards;}
                @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                .podium-container { display: flex; justify-content: center; align-items: flex-end; gap: 8px; margin-top: 50px; margin-bottom: 25px; padding: 0 10px; }
                .podium-item { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; background: white; border-radius: 20px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
                
                .podium-1 { height: 160px; z-index: 10; box-shadow: 0 15px 30px rgba(245, 158, 11, 0.2); border: 2px solid #fde68a; background: linear-gradient(180deg, #fff 0%, #fffbeb 100%);}
                .podium-2 { height: 130px; background: linear-gradient(180deg, #fff 0%, #f8fafc 100%); border: 1px solid #e2e8f0; }
                .podium-3 { height: 115px; background: linear-gradient(180deg, #fff 0%, #fff7ed 100%); border: 1px solid #ffedd5; }
                
                .podium-avatar { width: 52px; height: 52px; border-radius: 50%; border: 3px solid white; position: absolute; top: -26px; background: #f1f5f9; object-fit: cover; box-shadow: 0 5px 15px rgba(0,0,0,0.1);}
                .podium-1 .podium-avatar { width: 70px; height: 70px; top: -35px; border-color: #fde68a; }
                
                .podium-rank-badge { position: absolute; top: 18px; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 800; font-size: 0.7rem; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
                .podium-1 .podium-rank-badge { background: #f59e0b; top: 28px; width: 26px; height: 26px; font-size: 0.8rem; }
                .podium-2 .podium-rank-badge { background: #94a3b8; }
                .podium-3 .podium-rank-badge { background: #d97706; }

                .podium-info { margin-top: 50px; text-align: center; width: 100%; padding: 0 5px; }
                .podium-1 .podium-info { margin-top: 70px; }
                .podium-name { font-size: 0.7rem; font-weight: 800; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
                .podium-1 .podium-name { font-size: 0.85rem; color: #b45309; }
                .podium-pts { font-size: 0.7rem; color: #10b981; font-weight: 800; margin-top: 3px; }

                /* List View */
                .lb-item { display: flex; align-items: center; justify-content: space-between; background: white; padding: 12px 15px; border-radius: 16px; margin-bottom: 12px; border: 1px solid #f1f5f9; box-shadow: 0 4px 10px rgba(0,0,0,0.02); transition: transform 0.2s; }
                .lb-item:active { transform: scale(0.98); }
                .lb-rank { width: 28px; font-size: 0.9rem; font-weight: 800; color: #94a3b8; text-align: left; }
                .lb-avatar { width: 42px; height: 42px; border-radius: 14px; object-fit: cover; background: #f8fafc; border: 1px solid #e2e8f0; }
                .lb-name { font-size: 0.85rem; font-weight: 800; color: #0f172a; }
                .lb-pts { font-size: 0.85rem; font-weight: 800; color: #6366f1; background: #eef2ff; padding: 5px 12px; border-radius: 12px; border: 1px solid #e0e7ff; }

                /* Nav Bar */
                .nav-bar-container { position: fixed; bottom: 15px; left: 15px; right: 15px; z-index: 1000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;}
                .expanded-menu { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 20px; padding: 12px; display: flex; gap: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #fff; opacity: 0; transform: translateY(20px); pointer-events: none; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .nav-bar-container.open .expanded-menu { opacity: 1; transform: translateY(0); pointer-events: auto; }
                .nav-bar { height: 65px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-radius: 20px; display: flex; align-items: center; justify-content: space-around; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #fff; pointer-events: auto;}
                .nav-item { display: flex; flex-direction: column; align-items: center; color: #94a3b8; cursor: pointer; text-decoration: none; transition: 0.3s; }
                .nav-item.active { color: #6366f1; transform: translateY(-2px); }
                .nav-item i { font-size: 1.2rem; margin-bottom: 1px; font-style: normal; }
                .nav-item span { font-size: 0.5rem; font-weight: 700; white-space: nowrap; }
            `}</style>

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

            {/* Main Content */}
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{t.title}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{t.subtitle}</p>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8', fontWeight: 800 }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px', animation: 'spin 1s linear infinite' }}>⏳</div>
                        {t.loading}
                    </div>
                ) : leaderboardData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8', fontWeight: 800 }}>
                        {t.noUsers}
                    </div>
                ) : (
                    <>
                        {/* Podium (Top 3) */}
                        <div className="podium-container">
                            {/* 2nd Place */}
                            {TopThree[1] && (
                                <div className="podium-item podium-2">
                                    <img src={TopThree[1].avatar} className="podium-avatar" onError={(e) => {e.target.src=defaultAvatar}} />
                                    <div className="podium-rank-badge">2</div>
                                    <div className="podium-info">
                                        <div className="podium-name">{TopThree[1].name.split(' ')[0]}</div>
                                        <div className="podium-pts">{TopThree[1].points.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place */}
                            {TopThree[0] && (
                                <div className="podium-item podium-1">
                                    <div style={{ position: 'absolute', top: '-55px', fontSize: '2rem', zIndex: 20, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>👑</div>
                                    <img src={TopThree[0].avatar} className="podium-avatar" onError={(e) => {e.target.src=defaultAvatar}} />
                                    <div className="podium-rank-badge">1</div>
                                    <div className="podium-info">
                                        <div className="podium-name">{TopThree[0].name.split(' ')[0]}</div>
                                        <div className="podium-pts" style={{ color: '#f59e0b', fontSize: '0.8rem' }}>{TopThree[0].points.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {TopThree[2] && (
                                <div className="podium-item podium-3">
                                    <img src={TopThree[2].avatar} className="podium-avatar" onError={(e) => {e.target.src=defaultAvatar}} />
                                    <div className="podium-rank-badge">3</div>
                                    <div className="podium-info">
                                        <div className="podium-name">{TopThree[2].name.split(' ')[0]}</div>
                                        <div className="podium-pts">{TopThree[2].points.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* List View (4th to 50th) */}
                        <div style={{ marginTop: '20px' }}>
                            {RestList.map((lbUser, index) => {
                                const rank = index + 4;
                                const isMe = user && user.uid === lbUser.uid;

                                return (
                                    <div key={lbUser.uid} className="lb-item" style={isMe ? { borderColor: '#818cf8', background: '#f8fafc', borderWidth: '1.5px' } : {}}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div className="lb-rank">#{rank}</div>
                                            <img src={lbUser.avatar} className="lb-avatar" onError={(e) => {e.target.src=defaultAvatar}} />
                                            <div>
                                                <div className="lb-name">{lbUser.name} {isMe && <span style={{fontSize: '0.6rem', color: '#10b981', marginLeft: '5px'}}>(You)</span>}</div>
                                            </div>
                                        </div>
                                        <div className="lb-pts">
                                            {lbUser.points.toLocaleString()} <span style={{ fontSize: '0.55rem', color: '#94a3b8' }}>pts</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Navigation Bar */}
            <div className={`nav-bar-container ${navOpen ? 'open' : ''}`}>
                <div className="expanded-menu">
                    <div onClick={() => router.push('/leaderboard')} className="nav-item active">
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


