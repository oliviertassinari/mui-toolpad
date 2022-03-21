import * as React from 'react';
import { Box, Collapse, styled, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useStudioComponents } from '../../../studioComponents';
import * as studioDom from '../../../studioDom';
import { useDom } from '../../DomLoader';
import { usePageEditorApi } from './PageEditorProvider';

const WIDTH_COLLAPSED = 50;

const ComponentCatalogRoot = styled('div')({
  position: 'relative',
  width: WIDTH_COLLAPSED + 1,
  height: '100%',
  zIndex: 1,
  overflow: 'visible',
});

const ComponentCatalogItem = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 0),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.secondary,
  cursor: 'grab',
  '&:hover': {
    background: theme.palette.action.hover,
  },
}));

export interface ComponentCatalogProps {
  className?: string;
}

export default function ComponentCatalog({ className }: ComponentCatalogProps) {
  const api = usePageEditorApi();
  const dom = useDom();

  const [openStart, setOpenStart] = React.useState(0);

  const closeTimeoutRef = React.useRef<NodeJS.Timeout>();
  const openDrawer = React.useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setOpenStart(Date.now());
  }, []);

  const closeDrawer = React.useCallback(
    (delay?: number) => {
      const timeOpen = Date.now() - openStart;
      const defaultDelay = timeOpen > 750 ? 500 : 0;
      closeTimeoutRef.current = setTimeout(() => setOpenStart(0), delay ?? defaultDelay);
    },
    [openStart],
  );

  const handleDragStart = (componentType: string) => (event: React.DragEvent<HTMLElement>) => {
    event.dataTransfer.dropEffect = 'copy';
    const newNode = studioDom.createElement(dom, componentType, {});
    api.deselect();
    api.newNodeDragStart(newNode);
    closeDrawer(0);
  };

  const studioComponents = useStudioComponents(dom);

  const handleMouseEnter = React.useCallback(() => openDrawer(), [openDrawer]);
  const handleMouseLeave = React.useCallback(() => closeDrawer(), [closeDrawer]);

  return (
    <ComponentCatalogRoot
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          position: 'fixed',
          background: 'white',
          borderRight: 1,
          borderColor: 'divider',
        }}
      >
        <Collapse in={!!openStart} orientation="horizontal" timeout={200} sx={{ height: '100%' }}>
          <Box sx={{ width: 300, height: '100%', overflow: 'auto' }}>
            <Box display="grid" gridTemplateColumns="1fr" gap={1} padding={1}>
              {studioComponents.map((componentType) => {
                return (
                  <ComponentCatalogItem
                    key={componentType.id}
                    draggable
                    onDragStart={handleDragStart(componentType.id)}
                  >
                    <DragIndicatorIcon color="inherit" />
                    {componentType.displayName}
                  </ComponentCatalogItem>
                );
              })}
            </Box>
          </Box>
        </Collapse>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: WIDTH_COLLAPSED,
          }}
        >
          <Box sx={{ mt: 2 }}>{openStart ? <ChevronLeftIcon /> : <ChevronRightIcon />}</Box>
          <Box position="relative">
            <Typography
              sx={{
                position: 'absolute',
                top: 0,
                display: 'flex',
                alignItems: 'center',
                fontSize: 20,
                transform: 'rotate(90deg) translate(-10px, 0)',
                transformOrigin: '0 50%',
              }}
            >
              Components
            </Typography>
          </Box>
        </Box>
      </Box>
    </ComponentCatalogRoot>
  );
}
