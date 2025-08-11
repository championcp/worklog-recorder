import dynamic from 'next/dynamic';

const ReportsPage = dynamic(() => import('@/components/pages/ReportsPageComponent'), {
  ssr: false,
});

export default ReportsPage;