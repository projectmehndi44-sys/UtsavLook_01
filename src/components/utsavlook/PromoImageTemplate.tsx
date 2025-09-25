
'use client';
import { Star, IndianRupee } from 'lucide-react';
import React from 'react';

export interface PromoImageTemplateProps {
  backgroundImageUrl: string | null;
  artistName: string;
  artistServices: string;
  artistRating: number;
  baseCharge: number;
}

export const PromoImageTemplate: React.FC<PromoImageTemplateProps> = ({
  backgroundImageUrl,
  artistName,
  artistServices,
  artistRating,
  baseCharge,
}) => {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Roboto", sans-serif',
        backgroundColor: '#F5F5DC', // Soft Sand
        position: 'relative',
        color: '#8B4513', // Rich Henna
      }}
    >
      {backgroundImageUrl && (
        <img
          src={backgroundImageUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
          }}
          alt="AI Generated Background"
        />
      )}
      
      {/* Overlay to improve text readability */}
      <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to top, rgba(245, 245, 220, 0.9), rgba(245, 245, 220, 0.3))', // Soft Sand gradient
          zIndex: 2,
      }}></div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px',
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 3,
          boxSizing: 'border-box'
        }}
      >
        {/* Top Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{fontFamily: '"Playfair Display", serif', fontSize: '48px', fontWeight: 'bold' }}>
                UtsavLook
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: '9999px', border: '1px solid #CD7F32' }}>
                <Star style={{ width: '28px', height: '28px', color: '#CD7F32', fill: '#CD7F32' }} />
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#8B4513' }}>{artistRating.toFixed(1)}</span>
            </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '72px', fontWeight: 'bold', margin: 0, lineHeight: 1.1 }}>
                {artistName}
            </h2>
            <p style={{ fontSize: '32px', color: '#CD7F32', margin: '8px 0 0 0', fontWeight: '500' }}>
              {artistServices}
            </p>
             <p style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 0 0' }}>
                Starts from
                <span style={{ fontWeight: 'bold', fontSize: '36px', display: 'flex', alignItems: 'center'}}>
                    <IndianRupee style={{ width: '28px', height: '28px' }} />{baseCharge.toLocaleString()}
                </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
