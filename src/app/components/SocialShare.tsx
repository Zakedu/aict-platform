/**
 * SNS 공유 컴포넌트
 * - 카카오톡
 * - 트위터 (X)
 * - LinkedIn
 * - 링크 복사
 */

import { useState } from 'react';
import { Share2, Link2, Check, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COLORS = {
  navy: '#1E3A5F',
  gold: '#C9A227',
  success: '#059669',
  textMuted: '#64748B',
  border: '#E5E7EB',
  kakao: '#FEE500',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
};

interface ShareData {
  title: string;
  description: string;
  url: string;
  score?: number;
  certificateId?: string;
}

interface SocialShareProps {
  data: ShareData;
  variant?: 'buttons' | 'dropdown';
}

export const SocialShare = ({ data, variant = 'buttons' }: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  const texts = {
    ko: {
      share: '공유하기',
      copyLink: '링크 복사',
      copied: '복사됨!',
      kakao: '카카오톡',
      twitter: '트위터',
      linkedin: 'LinkedIn',
    },
    ja: {
      share: '共有する',
      copyLink: 'リンクをコピー',
      copied: 'コピー済み！',
      kakao: 'カカオトーク',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
    },
  };
  const t = texts[language];

  const shareUrl = data.url || window.location.href;

  // 카카오톡 공유
  const shareKakao = () => {
    if (typeof window !== 'undefined' && (window as any).Kakao) {
      const Kakao = (window as any).Kakao;
      if (!Kakao.isInitialized()) {
        // 실제 서비스에서는 Kakao App Key 필요
        console.log('Kakao SDK not initialized');
        return;
      }
      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: data.title,
          description: data.description,
          imageUrl: 'https://zakedu.github.io/aict-platform/og-image.png',
          link: { webUrl: shareUrl, mobileWebUrl: shareUrl },
        },
        buttons: [
          { title: '자세히 보기', link: { webUrl: shareUrl, mobileWebUrl: shareUrl } },
        ],
      });
    } else {
      // Kakao SDK 없으면 모바일 공유
      const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`;
      window.open(kakaoUrl, '_blank', 'width=600,height=400');
    }
  };

  // 트위터 공유
  const shareTwitter = () => {
    const text = data.score
      ? `${data.title} - ${data.score}점으로 합격했습니다! 🎉`
      : data.title;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  // LinkedIn 공유
  const shareLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
  };

  // 링크 복사
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 네이티브 공유 API 사용
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.description,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  const ShareButton = ({
    onClick,
    icon: Icon,
    label,
    bgColor,
    textColor = 'white',
  }: {
    onClick: () => void;
    icon: any;
    label: string;
    bgColor: string;
    textColor?: string;
  }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90 hover:scale-105"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={shareNative}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          style={{ backgroundColor: COLORS.navy, color: 'white' }}
        >
          <Share2 className="w-4 h-4" />
          <span>{t.share}</span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div
              className="absolute right-0 top-full mt-2 p-2 rounded-lg shadow-lg z-50 min-w-[180px]"
              style={{ backgroundColor: 'white', border: `1px solid ${COLORS.border}` }}
            >
              <button
                onClick={() => { shareKakao(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.kakao }}>
                  <MessageCircle className="w-4 h-4" style={{ color: '#3C1E1E' }} />
                </div>
                <span className="text-sm" style={{ color: COLORS.navy }}>{t.kakao}</span>
              </button>
              <button
                onClick={() => { shareTwitter(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.twitter }}>
                  <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: COLORS.navy }}>{t.twitter}</span>
              </button>
              <button
                onClick={() => { shareLinkedIn(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.linkedin }}>
                  <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: COLORS.navy }}>{t.linkedin}</span>
              </button>
              <hr className="my-2" style={{ borderColor: COLORS.border }} />
              <button
                onClick={() => { copyLink(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.navy }}>
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Link2 className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm" style={{ color: COLORS.navy }}>
                  {copied ? t.copied : t.copyLink}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // 버튼 형태
  return (
    <div className="flex flex-wrap gap-3">
      <ShareButton
        onClick={shareKakao}
        icon={MessageCircle}
        label={t.kakao}
        bgColor={COLORS.kakao}
        textColor="#3C1E1E"
      />
      <ShareButton
        onClick={shareTwitter}
        icon={() => (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        )}
        label={t.twitter}
        bgColor={COLORS.twitter}
      />
      <ShareButton
        onClick={shareLinkedIn}
        icon={() => (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        )}
        label={t.linkedin}
        bgColor={COLORS.linkedin}
      />
      <button
        onClick={copyLink}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all hover:bg-gray-100"
        style={{ border: `1px solid ${COLORS.border}`, color: COLORS.navy }}
      >
        {copied ? <Check className="w-4 h-4" style={{ color: COLORS.success }} /> : <Link2 className="w-4 h-4" />}
        <span>{copied ? t.copied : t.copyLink}</span>
      </button>
    </div>
  );
};
