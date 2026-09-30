import React from 'react';
import { Text as NativeText, TextProps } from 'react-native';
import { sansFont } from './theme';

export const Text = React.forwardRef<NativeText, TextProps>(function Text({ style, ...props }, ref) {
  return <NativeText ref={ref} {...props} style={[{ fontFamily: sansFont }, style]} />;
});
