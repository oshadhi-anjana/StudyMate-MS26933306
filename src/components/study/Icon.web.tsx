import React from 'react';
import { useFonts } from 'expo-font';
import { FontAwesome } from '@react-native-vector-icons/fontawesome/static';

export type IconName = React.ComponentProps<typeof FontAwesome>['name'];

// Register the bundled font explicitly in browsers before rendering its glyphs.
export function Icon(props: React.ComponentProps<typeof FontAwesome>) {
  const [loaded] = useFonts({
    FontAwesome: require('../../../assets/fonts/FontAwesome.ttf'),
  });

  if (!loaded) return null;

  return <FontAwesome accessible={false} importantForAccessibility="no" {...props} />;
}
