/** @jsxImportSource @emotion/react */
import type { FunctionFragment } from '@ethersproject/abi';
import { ethers } from 'ethers';
import { FieldArray } from 'formik';

import { FormikTextField } from 'containers/Form';
import { ErrorCode } from '../proposalSchema';
import { useStyles } from './styles';

interface CallDataFieldsProps {
  signature: string;
  actionIndex: number;
}

const parseSignature = (func: string) => {
  let funcInputs: FunctionFragment['inputs'] = [];
  try {
    const fragment = ethers.utils.FunctionFragment.from(func);
    funcInputs = fragment.inputs;
  } catch {}
  return funcInputs;
};

const CallDataFields: React.FC<CallDataFieldsProps> = ({ signature, actionIndex }) => {
  const styles = useStyles();
  const callDataTypes = parseSignature(signature || '');

  return (
    <FieldArray
      name="data"
      render={() =>
        callDataTypes.map((param, idx) => {
          const name = `actions.${actionIndex}.callData.${idx}`;

          return (
            <FormikTextField
              key={name}
              name={name}
              data-testid={name}
              css={[styles.formBottomMargin, styles.addTopMargin(idx === 0)]}
              placeholder={param.type}
              displayableErrorCodes={[
                ErrorCode.VALUE_REQUIRED,
                ErrorCode.CALL_DATA_ARGUMENT_INVALID,
              ]}
            />
          );
        })
      }
    />
  );
};

export default CallDataFields;
