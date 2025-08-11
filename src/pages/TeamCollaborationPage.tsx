import dynamic from 'next/dynamic';

const TeamCollaborationPage = dynamic(() => import('@/components/pages/TeamCollaborationPageComponent'), {
  ssr: false,
});

export default TeamCollaborationPage;