"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="landing-container">
            {/* Header / Navbar */}
            <header className="landing-header">
                <div className="logo-container">
                    <div className="logo-icon">🚀</div>
                    <h1 className="logo-text">TaskBazar</h1>
                </div>
                <button className="btn-login" onClick={() => router.push('/login')}>
                    লগইন করুন
                </button>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-badge">🎁 নতুন ইউজারদের জন্য বোনাস!</div>
                <h1 className="hero-title">
                    ঘরে বসেই প্রতিদিন <span className="highlight">আয় করুন!</span>
                </h1>
                <p className="hero-subtitle">
                    ফেসবুক পেজে লাইক, ইউটিউব চ্যানেল সাবস্ক্রাইব এবং ছোট ছোট সহজ কাজ করে প্রতিদিন ২০০-৫০০ টাকা পর্যন্ত আয় করুন। কোনো ইনভেস্টমেন্টের প্রয়োজন নেই!
                </p>
                
                <div className="hero-buttons">
                    <button className="btn-primary" onClick={() => router.push('/login')}>
                        একাউন্ট খুলুন <span style={{ marginLeft: '8px' }}>➔</span>
                    </button>
                    <button className="btn-secondary" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
                        কিভাবে কাজ করে?
                    </button>
                </div>

                {/* Trust Indicators */}
                <div className="trust-stats">
                    <div className="stat-item">
                        <span className="stat-number">১০,০০০+</span>
                        <span className="stat-label">অ্যাক্টিভ ইউজার</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">১০০%</span>
                        <span className="stat-label">ট্রাস্ট স্কোর</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">ইনস্ট্যান্ট</span>
                        <span className="stat-label">পেমেন্ট সিস্টেম</span>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="steps-section">
                <h2 className="section-title">কিভাবে আয় করবেন?</h2>
                <p className="section-subtitle">মাত্র ৩টি সহজ ধাপে আপনার ইনকাম শুরু করুন</p>

                <div className="steps-grid">
                    <div className="step-card">
                        <div className="step-icon">1️⃣</div>
                        <h3>একাউন্ট খুলুন</h3>
                        <p>খুব সহজেই আপনার ইমেইল দিয়ে ২ মিনিটে একটি ফ্রি একাউন্ট তৈরি করুন।</p>
                    </div>
                    <div className="step-card">
                        <div className="step-icon">2️⃣</div>
                        <h3>কাজ সম্পূর্ণ করুন</h3>
                        <p>ড্যাশবোর্ড থেকে ভিডিও দেখা, লাইক, ফলো করার মতো সহজ কাজগুলো করুন।</p>
                    </div>
                    <div className="step-card">
                        <div className="step-icon">3️⃣</div>
                        <h3>টাকা তুলে নিন</h3>
                        <p>কাজ শেষ হলেই পয়েন্ট পাবেন। পয়েন্ট জমিয়ে বিকাশ, নগদ বা রকেটে পেমেন্ট নিন।</p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2 className="section-title">কেন TaskBazar সেরা?</h2>
                
                <div className="features-list">
                    <div className="feature-item">
                        <div className="feat-icon bg-green">💸</div>
                        <div className="feat-text">
                            <h4>দ্রুত পেমেন্ট</h4>
                            <p>আমরা ২৪ ঘন্টার মধ্যে আপনার রিকোয়েস্ট করা টাকা পাঠিয়ে দিই।</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <div className="feat-icon bg-blue">🤝</div>
                        <div className="feat-text">
                            <h4>রেফারেল বোনাস</h4>
                            <p>আপনার বন্ধুদের ইনভাইট করুন এবং প্রতি রেফারে জিতে নিন নিশ্চিত বোনাস পয়েন্ট।</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <div className="feat-icon bg-purple">🛡️</div>
                        <div className="feat-text">
                            <h4>১০০% নিরাপদ</h4>
                            <p>আমাদের উন্নত ট্রাস্ট স্কোর সিস্টেমের মাধ্যমে ফেক কাজ রোধ করা হয়, তাই আপনার পরিশ্রম বিফলে যাবে না।</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Footer */}
            <footer className="landing-footer">
                <h2>আর দেরি কেন? আজই শুরু করুন!</h2>
                <p>হাজারো মানুষ প্রতিদিন আয় করছে, আপনি কেন পিছিয়ে থাকবেন?</p>
                <button className="btn-primary" onClick={() => router.push('/login')} style={{ marginTop: '20px' }}>
                    ফ্রি রেজিস্ট্রেশন করুন
                </button>
                <div className="footer-copyright">
                    © {new Date().getFullYear()} TaskBazar. All rights reserved.
                </div>
            </footer>

            <style>{`
                .landing-container {
                    font-family: 'Inter', system-ui, sans-serif;
                    background-color: #f8fafc;
                    min-height: 100vh;
                    color: #0f172a;
                    overflow-x: hidden;
                }
                
                /* Header */
                .landing-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    background: white;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }
                .logo-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .logo-icon {
                    font-size: 24px;
                }
                .logo-text {
                    font-size: 20px;
                    font-weight: 800;
                    color: #4f46e5;
                    margin: 0;
                }
                .btn-login {
                    background: #f1f5f9;
                    color: #475569;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .btn-login:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                }

                /* Hero Section */
                .hero-section {
                    padding: 60px 20px;
                    text-align: center;
                    background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
                }
                .hero-badge {
                    display: inline-block;
                    background: #fef2f2;
                    color: #ef4444;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 700;
                    margin-bottom: 20px;
                    border: 1px solid #fee2e2;
                }
                .hero-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    line-height: 1.2;
                    margin-bottom: 15px;
                    color: #1e293b;
                }
                .highlight {
                    color: #4f46e5;
                }
                .hero-subtitle {
                    font-size: 1rem;
                    color: #475569;
                    max-width: 600px;
                    margin: 0 auto 30px auto;
                    line-height: 1.6;
                }
                .hero-buttons {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    margin-bottom: 50px;
                    flex-wrap: wrap;
                }
                .btn-primary {
                    background: #4f46e5;
                    color: white;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
                }
                .btn-secondary {
                    background: white;
                    color: #4f46e5;
                    border: 2px solid #e0e7ff;
                    padding: 14px 28px;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .btn-secondary:hover {
                    background: #f5f8ff;
                    border-color: #c7d2fe;
                }

                .trust-stats {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 25px;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.03);
                    flex-wrap: wrap;
                }
                .stat-item {
                    display: flex;
                    flex-direction: column;
                }
                .stat-number {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #0f172a;
                }
                .stat-label {
                    font-size: 0.85rem;
                    color: #64748b;
                    font-weight: 600;
                }

                /* Sections Common */
                .section-title {
                    font-size: 2rem;
                    font-weight: 800;
                    text-align: center;
                    color: #1e293b;
                    margin-bottom: 10px;
                }
                .section-subtitle {
                    text-align: center;
                    color: #64748b;
                    margin-bottom: 40px;
                    font-size: 1rem;
                }

                /* Steps Section */
                .steps-section {
                    padding: 60px 20px;
                    background: white;
                }
                .steps-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    max-width: 1000px;
                    margin: 0 auto;
                }
                .step-card {
                    background: #f8fafc;
                    padding: 30px 20px;
                    border-radius: 20px;
                    text-align: center;
                    border: 1px solid #f1f5f9;
                    transition: transform 0.3s;
                }
                .step-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                }
                .step-icon {
                    font-size: 40px;
                    margin-bottom: 15px;
                }
                .step-card h3 {
                    font-size: 1.2rem;
                    font-weight: 800;
                    margin-bottom: 10px;
                    color: #0f172a;
                }
                .step-card p {
                    color: #475569;
                    font-size: 0.95rem;
                    line-height: 1.5;
                }

                /* Features Section */
                .features-section {
                    padding: 60px 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .features-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .feature-item {
                    display: flex;
                    align-items: center;
                    background: white;
                    padding: 20px;
                    border-radius: 16px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                    gap: 20px;
                }
                .feat-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    flex-shrink: 0;
                }
                .bg-green { background: #dcfce7; }
                .bg-blue { background: #dbeafe; }
                .bg-purple { background: #f3e8ff; }
                
                .feat-text h4 {
                    font-size: 1.1rem;
                    font-weight: 800;
                    margin: 0 0 5px 0;
                    color: #0f172a;
                }
                .feat-text p {
                    margin: 0;
                    color: #475569;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                /* Footer CTA */
                .landing-footer {
                    background: #0f172a;
                    color: white;
                    text-align: center;
                    padding: 60px 20px 30px 20px;
                    margin-top: 40px;
                }
                .landing-footer h2 {
                    font-size: 1.8rem;
                    font-weight: 800;
                    margin-bottom: 10px;
                }
                .landing-footer p {
                    color: #94a3b8;
                    font-size: 1rem;
                }
                .footer-copyright {
                    margin-top: 50px;
                    font-size: 0.8rem;
                    color: #475569;
                    border-top: 1px solid #1e293b;
                    padding-top: 20px;
                }

                /* Mobile Optimization */
                @media (max-width: 600px) {
                    .hero-title { font-size: 2rem; }
                    .hero-buttons { flex-direction: column; padding: 0 20px; }
                    .btn-primary, .btn-secondary { width: 100%; }
                    .trust-stats { gap: 15px; flex-direction: column; text-align: center; }
                    .feature-item { flex-direction: column; text-align: center; }
                    .feat-icon { margin: 0 auto; }
                }
            `}</style>
        </div>
    );
}

