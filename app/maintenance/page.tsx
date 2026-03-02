"use client"

import Head from 'next/head';
import { motion } from 'framer-motion';
import { Wrench, Clock, Mail, Twitter, Github } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MaintenancePage() {
  const [targetTime, setTargetTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isEst: true
  });

  useEffect(() => {
    // Get or set the target time in localStorage
    const storedTime = typeof window !== 'undefined' ? localStorage.getItem('maintenanceEndTime') : null;
    let target: Date;

    if (storedTime) {
      target = new Date(storedTime);
    } else {
      // Set target time to 24 hours from now in EST
      const now = new Date();
      const estOffset = -5 * 60 * 60 * 1000; // EST is UTC-5
      const estTime = new Date(now.getTime() + estOffset);
      target = new Date(estTime.getTime() + 24 * 60 * 60 * 1000);

      if (typeof window !== 'undefined') {
        localStorage.setItem('maintenanceEndTime', target.toISOString());
      }
    }

    setTargetTime(target);

    const timer = setInterval(() => {
      if (!target) return;

      const now = new Date();
      const estOffset = -5 * 60 * 60 * 1000; // EST is UTC-5
      const estTime = new Date(now.getTime() + estOffset);
      const difference = target.getTime() - estTime.getTime();

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isEst: true
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isEst: true
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  if (!targetTime) {
    return <div className="min-h-screen bg-blue-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Maintenance Mode | Your AI App</title>
        <meta name="description" content="We're upgrading our AI systems to serve you better" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          <div className="mb-8 flex justify-center">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 3
              }}
            >
              <Wrench className="w-24 h-24 text-indigo-600 stroke-[1.5]" />
            </motion.div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              System Maintenance
            </span>
          </h1>

          <p className="text-xl text-gray-700 mb-8">
            We're performing critical upgrades to enhance our AI capabilities.
            Thank you for your patience.
          </p>

          {/* Countdown Timer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-md mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-lg text-gray-800">
                Estimated Completion ({timeLeft.isEst ? 'EST' : 'UTC'})
              </h3>
            </div>

            <div className="flex justify-center items-center gap-2 mb-4">
              {timeLeft.days > 0 && (
                <>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-indigo-600">
                      {formatTime(timeLeft.days)}
                    </span>
                    <span className="text-xs text-gray-500">DAYS</span>
                  </div>
                  <span className="text-2xl text-gray-400">:</span>
                </>
              )}
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-indigo-600">
                  {formatTime(timeLeft.hours)}
                </span>
                <span className="text-xs text-gray-500">HOURS</span>
              </div>
              <span className="text-2xl text-gray-400">:</span>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-indigo-600">
                  {formatTime(timeLeft.minutes)}
                </span>
                <span className="text-xs text-gray-500">MINUTES</span>
              </div>
              <span className="text-2xl text-gray-400">:</span>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-indigo-600">
                  {formatTime(timeLeft.seconds)}
                </span>
                <span className="text-xs text-gray-500">SECONDS</span>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Maintenance ends at {targetTime.toLocaleString('en-US', {
                timeZone: 'America/New_York',
                hour12: true,
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </p>
          </motion.div>

          {/* Contact Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Stay Updated</h3>

            <div className="flex flex-col space-y-3">
              <a
                href="mailto:support@yourapp.com"
                className="flex items-center justify-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <Mail className="w-5 h-5" />
                support@yourapp.com
              </a>

              <a
                href="https://twitter.com/yourapp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-gray-700 hover:text-blue-500 transition-colors"
              >
                <Twitter className="w-5 h-5" />
                @yourapp
              </a>

              <a
                href="https://github.com/yourapp/status"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Github className="w-5 h-5" />
                Status Updates
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
