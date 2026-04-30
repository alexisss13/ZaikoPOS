'use client';

import { useState } from 'react';
import { ReportsMobile } from './ReportsMobile';

interface ReportsPageMobileProps {
  onClose: () => void;
}

export function ReportsPageMobile({ onClose }: ReportsPageMobileProps) {
  return <ReportsMobile onClose={onClose} />;
}