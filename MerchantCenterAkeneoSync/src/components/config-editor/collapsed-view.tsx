import SecondaryButton from '@commercetools-uikit/secondary-button';

interface CollapsedViewProps {
  onEdit: () => void;
}

const CollapsedView: React.FC<CollapsedViewProps> = ({ onEdit }) => {
  return <SecondaryButton onClick={onEdit} label="Edit Configuration" />;
};

export default CollapsedView;
