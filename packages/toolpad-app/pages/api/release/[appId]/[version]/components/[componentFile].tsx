import { NextApiHandler } from 'next';
import { transform } from 'sucrase';
import * as path from 'path';
import { loadVersionedDom, parseVersion } from '../../../../../../src/server/data';
import { NodeId } from '../../../../../../src/types';
import * as appDom from '../../../../../../src/appDom';
import { asArray } from '../../../../../../src/utils/collections';

export default (async (req, res) => {
  const [appId] = asArray(req.query.appId);
  const [componentFile] = asArray(req.query.componentFile);
  const { name: componentId } = path.parse(componentFile);

  const version = parseVersion(req.query.version);
  if (!version) {
    res.status(404).end();
    return;
  }

  const dom = await loadVersionedDom(appId, version);

  const codeComponent = appDom.getMaybeNode(dom, componentId as NodeId, 'codeComponent');

  if (!codeComponent) {
    res.status(404);
    res.end();
    return;
  }

  const { code: compiled } = transform(codeComponent.attributes.code.value, {
    transforms: ['jsx', 'typescript'],
  });

  res.setHeader('content-type', 'application/javascript');
  res.send(compiled);
}) as NextApiHandler<string>;
