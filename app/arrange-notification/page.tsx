// app/notification/page.tsx (or wherever you want)

'use client';

import PageWrapper from '@/components/layout/PageWrapper';
import CardContainer from '@/components/layout/CardContainer';
import { Logo, Title, Subtitle } from '@/components/ui/shared';
import { styled } from '@/styles/stitches.config';

export default function NotificationPage() {
  return (
    <PageWrapper>
      <CardContainer>
        <Logo src="/DonaTalk_icon_88x77.png" alt="DonaTalk Logo" />

        <Title>🎉 Congratulations!</Title>

        <Subtitle>
          It’s time to arrange a meeting. ✨
        </Subtitle>

        <Subtitle>
          We’ve sent the detailed meeting instructions to your email. 📩<br />
          Please check your inbox and coordinate the meeting.
        </Subtitle>

      </CardContainer>
    </PageWrapper>
  );
}
