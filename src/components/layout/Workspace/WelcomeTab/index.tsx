import { StartSection } from './StartSection';
import { TitleBlock } from './TitleBlock';
import { WalkthroughsSection } from './WalkthroughsSection';

// SIZE: centered column capped at max-w-4xl (~896px); vertical padding py-16.
export function WelcomeTab() {
  return (
    <div className="h-full w-full overflow-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-8 py-16">
        <TitleBlock />
        <div className="grid grid-cols-2 gap-10">
          <StartSection />
          <WalkthroughsSection />
        </div>
      </div>
    </div>
  );
}
