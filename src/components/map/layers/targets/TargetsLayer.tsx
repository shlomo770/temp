import { FC } from 'react';

interface TargetsLayerProps {
  map: any;
  showLabels?: boolean;
}

/**
 * ליבלים ואייקונים של מטרות ב-deck.gl (RealtimeDeckOverlay); קומפוננטה זו נשארה לתאימות API.
 * הקומפוננטה הזו לא מרנדרת DIV – השארנו אותה ל־API backward compatibility.
 */
const TargetsLayer: FC<TargetsLayerProps> = () => {
  return null;
};

export default TargetsLayer;
