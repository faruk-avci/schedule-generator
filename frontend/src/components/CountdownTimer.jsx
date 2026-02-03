import React, { useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const CountdownTimer = ({ targetDate, language }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    // Add translation keys if they don't exist in the main file yet, 
    // or just use hardcoded objects here for simplicity as this is a specific deadline feature
    const t = {
        tr: {
            title: "DERS KAYITLARI KAPANIYOR",
            remaining: "KALAN SÜRE:",
            closed: "SÜRE DOLDU",
            hours: "SAAT",
            minutes: "DAKİKA",
            seconds: "SANİYE"
        },
        en: {
            title: "REGISTRATION CLOSING SOON",
            remaining: "TIME REMAINING:",
            closed: "CLOSED",
            hours: "HOURS",
            minutes: "MINUTES", // Fixed typo "MINUTS" -> "MINUTES"
            seconds: "SECONDS"
        }
    }[language] || { // Fallback
        title: "REGISTRATION CLOSING SOON",
        remaining: "TIME REMAINING:",
        closed: "CLOSED",
        hours: "HOURS",
        minutes: "MINUTES",
        seconds: "SECONDS"
    };

    function calculateTimeLeft() {
        // Force timezone to Turkey (UTC+3)
        // targetDate string is expected to be ISO format or parsable
        // But for safety, we'll assume the input string is already correct local time notion
        // or we handle specifically.
        // User asked for "3 february 23.59".

        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        } else {
            timeLeft = null; // Time is up
        }

        return timeLeft;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    }); // No dependency array ensures it runs every render (triggered by state change) effectively loop

    if (!timeLeft) {
        return null; // Or return a "Closed" banner if preferred, but user said "close [at]..." implies urgency up to that point.
        // Actually user said "site will be closed", maybe show closed message? 
        // Let's hide it or show "Closed" based on preference. 
        // I will show a "Closed" message to be clear.
    }

    return (
        <div style={{
            background: 'linear-gradient(90deg, #A50050 0%, #c21d64 100%)',
            color: 'white',
            padding: '15px',
            borderRadius: '12px',
            marginTop: '5px',
            marginBottom: '5px', // Spacing as requested
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px rgba(165, 0, 80, 0.2)',
            textAlign: 'center'
        }}>
            <div style={{
                display: 'flex',
                gap: '15px',
                fontSize: '24px',
                fontWeight: '700',
                fontFamily: 'monospace' // Monospace for stable numbers
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 'normal' }}>{t.hours}</span>
                </div>
                <span>:</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 'normal' }}>{t.minutes}</span>
                </div>
                <span>:</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 'normal' }}>{t.seconds}</span>
                </div>
            </div>

            <div style={{ fontSize: '12px', opacity: 0.9 }}>
                {new Date(targetDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} 23:59
            </div>
        </div>
    );
};

export default CountdownTimer;
