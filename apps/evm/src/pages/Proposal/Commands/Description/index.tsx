import { cn } from '@venusprotocol/ui';

export interface DescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'warning' | 'info';
}

export const Description: React.FC<DescriptionProps> = ({ type = 'info', ...otherProps }) => (
  <p
    className={cn('text-sm md:pl-7 text-grey', type === 'warning' && 'text-orange')}
    {...otherProps}
  />
);
