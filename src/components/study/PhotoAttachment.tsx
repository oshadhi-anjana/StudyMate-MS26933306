import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { Button, Message } from './Controls';
import { useStudy } from '../../state/StudyProvider';
import { loadStudyImage } from '../../services/imageCache';
import { friendlyError } from '../../services/errors';

export function PhotoAttachment({ photoUri, photoURL, photoId, autoLoad = false }: {
  photoUri?: string; photoURL?: string; photoId?: string; autoLoad?: boolean;
}) {
  const { user, online } = useStudy();
  const [uri, setUri] = useState(photoUri || photoURL || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setUri(photoUri || photoURL || ''); setError(''); setBusy(false);
    if ((!photoUri && !photoURL) && photoId && user && (autoLoad || attempt > 0)) {
      setBusy(true);
      void loadStudyImage(user.uid, photoId, online)
        .then(value => { if (active) setUri(value); })
        .catch(value => { if (active) setError(friendlyError(value)); })
        .finally(() => { if (active) setBusy(false); });
    }
    return () => { active = false; };
  }, [photoUri, photoURL, photoId, user?.uid, online, autoLoad, attempt]);
  return <View style={{ gap: 10 }}>
    {!!uri && <Image source={{ uri }} style={{ width: '100%', height: autoLoad ? 230 : 160, borderRadius: 12 }} resizeMode="contain" accessibilityLabel="Attached study photo" onError={() => setError('This photo could not be displayed. Reopen the note or attach it again.')} />}
    {!uri && photoId && <Button label={error ? 'Retry photo' : 'View photo'} variant="secondary" small busy={busy} onPress={() => setAttempt(value => value + 1)} />}
    <Message text={error} error />
  </View>;
}
