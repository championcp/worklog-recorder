import dynamic from 'next/dynamic';

const DashboardManagement = dynamic(() => import('@/components/pages/DashboardManagementPage'), {
  ssr: false,
});

export default DashboardManagement;