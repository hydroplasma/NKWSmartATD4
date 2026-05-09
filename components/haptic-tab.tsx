import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: TouchableOpacityProps) {
  return (
    <TouchableOpacity
      {...props}
      onPress={(e) => {
        if (process.env.EXPO_OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPress?.(e);
      }}
    />
  );
}
