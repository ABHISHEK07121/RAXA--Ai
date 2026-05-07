import Navbar from '@/app/components/Navbar';
import AdaptiveQuestionnaire from '@/app/components/AdaptiveQuestionnaire';

export default function AdaptiveQuestionnairePageRoute() {
  return (
    <>
      <Navbar />
      <main>
        <AdaptiveQuestionnaire />
      </main>
    </>
  );
}