import { useLiveRoom } from '../../context/LiveRoomContext';
import { useLocale } from '../../context/LocaleContext';
import { Avatar } from '../AvatarUpload';

/**
 * Presence list for a live room — shows online member count and avatars.
 * Data comes from LiveRoomContext (populated by socket presence events).
 */
export function OnlineUsersList() {
  const { onlineUsers, onlineCount } = useLiveRoom();
  const { locale } = useLocale();
  const isArabic = locale === 'ar';

  return (
    <div className="rounded-2xl border border-sura-ivory/10 bg-sura-ink/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-inter text-sm font-semibold text-sura-ivory">
          {isArabic ? 'المتصلون الآن' : 'Online now'}
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-sura-ivory/60">
          <span className="h-2 w-2 rounded-full bg-green-400" aria-hidden="true" />
          {onlineCount}
        </span>
      </div>

      {onlineUsers.length === 0 ? (
        <p className="text-xs text-sura-ivory/50">{isArabic ? 'لا يوجد متصلون' : 'No one online'}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {onlineUsers.map((u) => (
            <li key={u.id} className="flex items-center gap-1.5" title={u.name || u.id}>
              <Avatar url={undefined} name={u.name || u.id} size="xs" />
              <span className="text-xs text-sura-ivory/70">{u.name || u.id.slice(0, 6)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OnlineUsersList;
