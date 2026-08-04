import { Avatar } from '../AvatarUpload';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { setModerator, type CircleMember } from '../../services/studyCircleService';

interface CircleMembersListProps {
  circleId: string;
  members: CircleMember[];
  onMembersChange?: (members: CircleMember[]) => void;
}

const ROLE_LABEL_EN: Record<string, string> = { owner: 'Owner', moderator: 'Moderator', member: 'Member' };
const ROLE_LABEL_AR: Record<string, string> = { owner: 'مالك', moderator: 'مشرف', member: 'عضو' };

/**
 * Circle member list with role badges. Owner can promote members to
 * moderator. Only active members are shown.
 */
export function CircleMembersList({ circleId, members, onMembersChange }: CircleMembersListProps) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isArabic = locale === 'ar';
  const roleLabels = isArabic ? ROLE_LABEL_AR : ROLE_LABEL_EN;

  const currentUser = members.find((m) => m.userId === user?.id);
  const isOwner = currentUser?.role === 'owner';
  const isModerator = currentUser?.role === 'moderator' || isOwner;

  const handlePromote = async (member: CircleMember) => {
    if (member.role === 'moderator' || member.role === 'owner') return;
    try {
      await setModerator(circleId, member.userId);
      onMembersChange?.(
        members.map((m) => (m.userId === member.userId ? { ...m, role: 'moderator' } : m))
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 p-4">
      <h3 className="mb-3 font-inter text-sm font-semibold text-sura-ivory">
        {isArabic ? 'الأعضاء' : 'Members'} ({members.length})
      </h3>
      <ul className="space-y-2">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-2">
            <Avatar url={member.user.avatar ?? undefined} name={member.user.name} size="sm" />
            <span className="flex-1 truncate text-sm text-sura-ivory/80">{member.user.name}</span>
            <span className="rounded-full bg-sura-ivory/10 px-2 py-0.5 text-[10px] text-sura-ivory/60">
              {roleLabels[member.role] ?? member.role}
            </span>
            {isOwner && member.role === 'member' && (
              <button
                type="button"
                onClick={() => handlePromote(member)}
                className="text-[10px] text-sura-teal hover:underline"
              >
                {isArabic ? 'ترقية' : 'Promote'}
              </button>
            )}
            {isModerator && member.role === 'member' && (
              <span className="text-[10px] text-sura-ivory/30" aria-hidden="true">
                •
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CircleMembersList;
