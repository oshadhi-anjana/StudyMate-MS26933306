import React from 'react';
import { Text as NativeText, TextInstance, TextProps } from 'react-native';
import { sansFont } from './theme';

export const Text = React.forwardRef<TextInstance, TextProps>(function Text({ style, ...props }, ref) {
  return <NativeText ref={ref} {...props} style={[{ fontFamily: sansFont }, style]} />;
});
