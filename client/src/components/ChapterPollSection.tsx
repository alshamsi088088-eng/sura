import { PollComponent } from './PollComponent';
import { PollCreator } from './PollCreator';

interface ChapterPollSectionProps {
  chapterId: string;
  isAuthor?: boolean;
}

export function ChapterPollSection({ chapterId, isAuthor }: ChapterPollSectionProps) {
  return (
    <div className="my-6 border-t border-sura-ivory/10 pt-6">
      {isAuthor && (
        <PollCreator
          contentId={chapterId}
          contentType="chapter"
        />
      )}
      <PollComponent
        contentId={chapterId}
        contentType="chapter"
      />
    </div>
  );
}