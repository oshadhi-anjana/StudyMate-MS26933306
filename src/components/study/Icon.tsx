import React from 'react';
import { FontAwesome } from '@react-native-vector-icons/fontawesome';

export type IconName = React.ComponentProps<typeof FontAwesome>['name'];

// The dynamic font entry works in Expo Go, native builds, and web.
export function Icon(props: React.ComponentProps<typeof FontAwesome>) {
  return <FontAwesome accessible={false} importantForAccessibility="no" {...props} />;
}
