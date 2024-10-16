import {
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  List,
  ListItem,
  SelectChangeEvent,
  DialogActions,
  Box,
  Typography,
} from '@mui/material';
import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import { ArgTypeDefinitions, UseDataQuery } from '@mui/toolpad-core';
import useLatest from '../../../utils/useLatest';
import { useDom, useDomApi } from '../../DomLoader';
import { usePageEditorState } from './PageEditorProvider';
import * as appDom from '../../../appDom';
import { NodeId } from '../../../types';
import { ExactEntriesOf } from '../../../utils/types';
import { getQueryNodeArgTypes } from '../../../toolpadDataSources/client';
import NodeAttributeEditor from './NodeAttributeEditor';
import NodeNameEditor from '../NodeNameEditor';
import JsonView from '../../JsonView';

interface ParamsEditorProps<Q> {
  node: appDom.AppDomNode;
  argTypes: ArgTypeDefinitions<Q>;
}

function ParamsEditor<Q>({ node, argTypes }: ParamsEditorProps<Q>) {
  return (
    <Stack spacing={1}>
      {(Object.entries(argTypes) as ExactEntriesOf<ArgTypeDefinitions<Q>>).map(
        ([propName, propTypeDef]) =>
          propTypeDef ? (
            <div key={propName}>
              <NodeAttributeEditor
                node={node}
                namespace="params"
                name={propName}
                argType={propTypeDef}
              />
            </div>
          ) : null,
      )}
    </Stack>
  );
}

interface PreviewQueryStateResultProps {
  node: appDom.QueryStateNode;
}

function PreviewQueryStateResult({ node }: PreviewQueryStateResultProps) {
  const { viewState } = usePageEditorState();
  const actualNodeState: UseDataQuery | undefined = viewState.pageState[node.name] as any;
  return (
    <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
      {node.attributes.api.value ? (
        <JsonView src={actualNodeState?.data} />
      ) : (
        <Typography>No data</Typography>
      )}
    </Box>
  );
}

interface QueryStateNodeEditorProps<P> {
  node: appDom.QueryStateNode<P>;
}

function QueryStateNodeEditor<P>({ node }: QueryStateNodeEditorProps<P>) {
  const dom = useDom();
  const domApi = useDomApi();
  const app = appDom.getApp(dom);
  const { apis = [] } = appDom.getChildNodes(dom, app);

  const handleSelectionChange = React.useCallback(
    (event: SelectChangeEvent<'' | NodeId>) => {
      const apiNodeId = event.target.value ? (event.target.value as NodeId) : null;
      domApi.setNodeNamespacedProp(node, 'attributes', 'api', appDom.createConst(apiNodeId));
    },
    [domApi, node],
  );

  const argTypes = getQueryNodeArgTypes(dom, node);

  return (
    <React.Fragment>
      <Stack spacing={1} py={1}>
        <NodeNameEditor node={node} />
        <FormControl fullWidth size="small">
          <InputLabel id={`select-data-query`}>Query</InputLabel>
          <Select
            value={node.attributes.api.value || ''}
            labelId="select-data-query"
            label="Query"
            onChange={handleSelectionChange}
            size="small"
          >
            <MenuItem value="">---</MenuItem>
            {apis.map(({ id, name }) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <ParamsEditor node={node} argTypes={argTypes} />
        <PreviewQueryStateResult node={node} />
      </Stack>
    </React.Fragment>
  );
}

export default function QueryStateEditor() {
  const dom = useDom();
  const state = usePageEditorState();
  const domApi = useDomApi();

  const [editedState, setEditedState] = React.useState<NodeId | null>(null);
  const editedStateNode = editedState ? appDom.getNode(dom, editedState, 'queryState') : null;
  const handleEditStateDialogClose = React.useCallback(() => setEditedState(null), []);

  const page = appDom.getNode(dom, state.nodeId, 'page');
  const { queryStates = [] } = appDom.getChildNodes(dom, page) ?? [];

  const handleCreate = React.useCallback(() => {
    const stateNode = appDom.createNode(dom, 'queryState', {
      params: {},
      attributes: { api: appDom.createConst(null) },
    });
    domApi.addNode(stateNode, page, 'queryStates');
    setEditedState(stateNode.id);
  }, [dom, domApi, page]);

  // To keep it around during closing animation
  const lastEditedStateNode = useLatest(editedStateNode);

  const handleRemove = React.useCallback(() => {
    if (editedStateNode) {
      domApi.removeNode(editedStateNode.id);
    }
    handleEditStateDialogClose();
  }, [editedStateNode, handleEditStateDialogClose, domApi]);

  return (
    <Stack spacing={1} alignItems="start">
      <Button color="inherit" startIcon={<AddIcon />} onClick={handleCreate}>
        create query state
      </Button>
      <List>
        {queryStates.map((stateNode) => {
          return (
            <ListItem key={stateNode.id} button onClick={() => setEditedState(stateNode.id)}>
              {stateNode.name}
            </ListItem>
          );
        })}
      </List>
      {lastEditedStateNode ? (
        <Dialog
          fullWidth
          maxWidth="lg"
          open={!!editedStateNode}
          onClose={handleEditStateDialogClose}
          scroll="body"
        >
          <DialogTitle>Edit Query State ({lastEditedStateNode.id})</DialogTitle>
          <DialogContent>
            <QueryStateNodeEditor node={lastEditedStateNode} />
          </DialogContent>
          <DialogActions>
            <Button color="inherit" variant="text" onClick={handleEditStateDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleRemove}>Remove</Button>
          </DialogActions>
        </Dialog>
      ) : null}
    </Stack>
  );
}
