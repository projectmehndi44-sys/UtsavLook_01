
'use client';
import { Star, IndianRupee } from 'lucide-react';
import React from 'react';

export interface PromoImageTemplateProps {
  workImages: string[];
  artistName: string;
  artistServices: string;
  artistRating: number;
  baseCharge: number;
  artistProfilePic?: string;
}

export const PromoImageTemplate: React.FC<PromoImageTemplateProps> = ({
  workImages = [],
  artistName,
  artistServices,
  artistRating,
  baseCharge,
  artistProfilePic
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
        background: 'radial-gradient(circle, hsl(40 55% 95% / 0.8) 0%, hsl(25 75% 32% / 0.9) 100%)',
        position: 'relative',
        color: '#8B4513',
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
            <div style={{fontFamily: 'var(--font-playfair-display)', fontSize: '48px', fontWeight: 'bold' }}>
                <span style={{color: 'hsl(var(--accent))'}}>Utsav</span>
                <span style={{color: 'hsl(var(--primary))'}}>Look</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.8)', padding: '8px 16px', borderRadius: '9999px', border: '1px solid #CD7F32' }}>
                <Star style={{ width: '28px', height: '28px', color: '#CD7F32', fill: '#CD7F32' }} />
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#8B4513' }}>{artistRating.toFixed(1)}</span>
            </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
           {artistProfilePic && (
              <img
                src={artistProfilePic}
                crossOrigin="anonymous"
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  border: '6px solid white',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  flexShrink: 0
                }}
                alt={artistName}
              />
            )}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            flexGrow: 1
          }}>
            <h2 style={{ fontFamily: '"Roboto", sans-serif', fontSize: '48px', fontWeight: 'bold', margin: 0, lineHeight: 1.2, color: 'hsl(var(--primary))' }}>
                {artistName}
            </h2>
            <p style={{ fontSize: '24px', color: '#CD7F32', margin: '4px 0 0 0', fontWeight: '500' }}>
              {artistServices}
            </p>
             <p style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0 0 0' }}>
                Starts from
                <span style={{ fontWeight: 'bold', fontSize: '28px', display: 'flex', alignItems: 'center'}}>
                    <IndianRupee style={{ width: '22px', height: '22px' }} />{baseCharge.toLocaleString()}
                </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
