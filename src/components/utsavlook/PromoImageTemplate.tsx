
'use client';
import { Star, IndianRupee } from 'lucide-react';
import React from 'react';

export interface PromoImageTemplateProps {
  workImages: string[];
  artistName: string;
  artistServices: string;
  artistRating: number;
  baseCharge: number;
}

export const PromoImageTemplate: React.FC<PromoImageTemplateProps> = ({
  workImages = [],
  artistName,
  artistServices,
  artistRating,
  baseCharge,
}) => {
  // Define positions for a 4-image collage
  const imagePositions = [
    { top: '5%', left: '5%', width: '45%', height: '55%', transform: 'rotate(-3deg)' },
    { top: '10%', left: '50%', width: '45%', height: '40%', transform: 'rotate(2deg)' },
    { top: '45%', left: '40%', width: '55%', height: '50%', transform: 'rotate(-1deg)' },
    { top: '65%', left: '5%', width: '30%', height: '30%', transform: 'rotate(4deg)' },
  ];

  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Roboto", sans-serif',
        // Wow background: a subtle radial gradient using brand colors
        background: 'radial-gradient(circle, hsl(40 55% 95% / 0.8) 0%, hsl(25 75% 32% / 0.9) 100%)',
        position: 'relative',
        color: '#8B4513', // Rich Henna
        overflow: 'hidden',
      }}
    >
      {/* Image Collage */}
      {workImages.map((src, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            ...imagePositions[index],
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
            borderRadius: '12px',
            border: '8px solid white',
            overflow: 'hidden',
          }}
        >
          <img
            src={src}
            crossOrigin="anonymous"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            alt={`Collage image ${index + 1}`}
          />
        </div>
      ))}

      {/* Foreground content */}
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
            <div style={{fontFamily: '"Playfair Display", serif', fontSize: '48px', fontWeight: 'bold', color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                UtsavLook
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.8)', padding: '8px 16px', borderRadius: '9999px', border: '1px solid #CD7F32' }}>
                <Star style={{ width: '28px', height: '28px', color: '#CD7F32', fill: '#CD7F32' }} />
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#8B4513' }}>{artistRating.toFixed(1)}</span>
            </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
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
