import BigNumber from 'bignumber.js';

import type { ProposalApiResponse } from 'clients/api/queries/getVoterHistory/types';
import {
  type AbstainVoter,
  type AgainstVoter,
  type ForVoter,
  type Proposal,
  ProposalType,
  VoteSupport,
} from 'types';
import { areAddressesEqual, convertToDate, formatToProposalDescription } from 'utilities';

export const formatToProposal = ({
  cancelTimestamp,
  createdTimestamp,
  description,
  endBlock,
  endTimestamp,
  executedTimestamp,
  proposer,
  queuedTimestamp,
  eta,
  startTimestamp,
  state,
  createdTxHash,
  cancelTxHash,
  executedTxHash,
  queuedTxHash,
  proposalType,
  proposalId,
  proposalActions,
  votes,
  forVotesMantissa,
  abstainedVotesMantissa,
  againstVotesMantissa,
  accountAddress,
}: ProposalApiResponse & { accountAddress: string }): Proposal => {
  const endDate = endTimestamp ? convertToDate({ timestampSeconds: endTimestamp }) : undefined;

  const formattedDescription = formatToProposalDescription({ description });
  const allVotes = votes || [];
  const forVotes: ForVoter[] = [];
  const againstVotes: AgainstVoter[] = [];
  const abstainVotes: AbstainVoter[] = [];

  allVotes?.forEach(vote => {
    const enrichedVote = {
      ...vote,
      blockTimestamp: new Date(vote.blockTimestamp),
      votesMantissa: new BigNumber(vote.votesMantissa),
    };

    if (vote.support === VoteSupport.For) {
      forVotes.push(enrichedVote as ForVoter);
    } else if (vote.support === VoteSupport.Against) {
      againstVotes.push(enrichedVote as AgainstVoter);
    } else if (vote.support === VoteSupport.Abstain) {
      abstainVotes.push(enrichedVote as AbstainVoter);
    }
  });

  forVotes.sort((a, b) => b.votesMantissa.minus(a.votesMantissa).toNumber());
  againstVotes.sort((a, b) => b.votesMantissa.minus(a.votesMantissa).toNumber());
  abstainVotes.sort((a, b) => b.votesMantissa.minus(a.votesMantissa).toNumber());

  const abstainVotesValue = new BigNumber(abstainedVotesMantissa);
  const againstVotesValue = new BigNumber(againstVotesMantissa);
  const forVotesValue = new BigNumber(forVotesMantissa);

  const totalVotesMantissa = abstainVotesValue.plus(againstVotesValue).plus(forVotesValue);

  const userVoteSupport = votes?.find(v => areAddressesEqual(v.address, accountAddress))?.support;

  const formattedActions = (proposalActions || [])
    .map(({ calldata, value, ...action }) => ({
      ...action,
      value: value || '',
      callData: calldata,
    }))
    .sort((a, b) => a.actionIndex - b.actionIndex);

  const proposal: Proposal = {
    abstainedVotesMantissa: abstainVotesValue,
    againstVotesMantissa: againstVotesValue,
    cancelDate: cancelTimestamp ? convertToDate({ timestampSeconds: cancelTimestamp }) : undefined,
    createdDate: createdTimestamp
      ? convertToDate({ timestampSeconds: createdTimestamp })
      : undefined,
    description: formattedDescription,
    endBlock,
    endDate,
    executedDate: executedTimestamp
      ? convertToDate({ timestampSeconds: executedTimestamp })
      : undefined,
    forVotesMantissa: forVotesValue,
    proposalId,
    proposerAddress: proposer,
    queuedDate: queuedTimestamp ? convertToDate({ timestampSeconds: queuedTimestamp }) : undefined,
    executionEtaDate: eta ? convertToDate({ timestampSeconds: eta }) : undefined,
    startDate: convertToDate({ timestampSeconds: startTimestamp }),
    state,
    createdTxHash: createdTxHash ?? undefined,
    cancelTxHash: cancelTxHash ?? undefined,
    executedTxHash: executedTxHash ?? undefined,
    queuedTxHash: queuedTxHash ?? undefined,
    totalVotesMantissa,
    proposalActions: formattedActions,
    forVotes,
    againstVotes,
    abstainVotes,
    proposalType: proposalType ?? ProposalType.NORMAL,
    userVoteSupport,
    remoteProposals: [], // This data isn't used in the UI but requires an extra call to be fetch, so we don't fetch it
  };

  return proposal;
};
