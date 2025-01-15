import ConfigEditor from './config-editor';
import CollapsedView from './collapsed-view';

interface ConfigEditorContainerProps {
  onEditingChange: (isEditing: boolean) => void;
  onSave: (config: string) => Promise<void>;
  config: string;
  isEditing: boolean;
}

const ConfigEditorContainer = ({
  onEditingChange,
  onSave,
  config,
  isEditing,
}: ConfigEditorContainerProps) => {
  if (!isEditing) {
    return <CollapsedView onEdit={() => onEditingChange(true)} />;
  }

  return (
    <ConfigEditor
      initialConfig={config}
      onSave={onSave}
      onCancel={() => onEditingChange(false)}
    />
  );
};

export default ConfigEditorContainer;
