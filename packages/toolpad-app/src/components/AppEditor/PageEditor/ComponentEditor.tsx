import { styled, Typography } from '@mui/material';
import * as React from 'react';
import { ArgTypeDefinition, ArgTypeDefinitions } from '@mui/toolpad-core';
import { ExactEntriesOf } from '../../../utils/types';
import * as appDom from '../../../appDom';
import NodeAttributeEditor from './NodeAttributeEditor';
import { useDom } from '../../DomLoader';
import { usePageEditorState } from './PageEditorProvider';
import PageOptionsPanel from './PageOptionsPanel';
import RuntimeErrorAlert from './RuntimeErrorAlert';
import NodeNameEditor from '../NodeNameEditor';
import { useToolpadComponent } from '../toolpadComponents';

const classes = {
  control: 'Toolpad_Control',
};

const ComponentPropsEditorRoot = styled('div')(({ theme }) => ({
  [`& .${classes.control}`]: {
    margin: theme.spacing(1, 0),
  },
}));

function shouldRenderControl(propTypeDef: ArgTypeDefinition) {
  if (propTypeDef.typeDef.type === 'element') {
    return propTypeDef.control?.type !== 'slot' && propTypeDef.control?.type !== 'slots';
  }
  return true;
}

interface ComponentPropsEditorProps<P> {
  node: appDom.ElementNode<P>;
}

function ComponentPropsEditor<P>({ node }: ComponentPropsEditorProps<P>) {
  const dom = useDom();
  const definition = useToolpadComponent(dom, node.attributes.component.value);

  return (
    <ComponentPropsEditorRoot>
      {(Object.entries(definition.argTypes) as ExactEntriesOf<ArgTypeDefinitions<P>>).map(
        ([propName, propTypeDef]) =>
          propTypeDef && shouldRenderControl(propTypeDef) ? (
            <div key={propName} className={classes.control}>
              <NodeAttributeEditor
                node={node}
                namespace="props"
                name={propName}
                argType={propTypeDef}
              />
            </div>
          ) : null,
      )}
    </ComponentPropsEditorRoot>
  );
}

interface SelectedNodeEditorProps {
  node: appDom.ElementNode;
}

function SelectedNodeEditor({ node }: SelectedNodeEditorProps) {
  const dom = useDom();
  const { viewState } = usePageEditorState();
  const nodeError = viewState.nodes[node.id]?.error;

  const component = useToolpadComponent(dom, node.attributes.component.value);

  return (
    <React.Fragment>
      <Typography variant="subtitle1">Component: {component.displayName}</Typography>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        ID: {node.id}
      </Typography>
      <NodeNameEditor node={node} />
      {nodeError ? <RuntimeErrorAlert error={nodeError} /> : null}
      {node ? (
        <React.Fragment>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Properties:
          </Typography>
          <ComponentPropsEditor node={node} />
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );
}

export interface ComponentEditorProps {
  className?: string;
}

export default function ComponentEditor({ className }: ComponentEditorProps) {
  const dom = useDom();
  const editor = usePageEditorState();

  const { selection } = editor;

  const selectedNode = selection ? appDom.getNode(dom, selection) : null;

  return (
    <div className={className}>
      {selectedNode && appDom.isElement(selectedNode) ? (
        // Add key to make sure it mounts every time selected node changes
        <SelectedNodeEditor key={selectedNode.id} node={selectedNode} />
      ) : (
        <PageOptionsPanel />
      )}
    </div>
  );
}
