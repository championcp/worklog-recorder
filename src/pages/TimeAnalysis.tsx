import dynamic from 'next/dynamic';

const TimeAnalysisPage = dynamic(() => import('@/components/pages/TimeAnalysisPage'), {
  ssr: false,
});

export default TimeAnalysisPage;