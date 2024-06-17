import { fetchGraphQlResponse } from './fetch-graphql-response';
import { Issue } from '../../shared/types';
import { GitHubIssueNode } from './shared/types';
import { toFormattedIssue } from './shared/helpers';
import { issueQuery } from './shared/queres';

export async function getIssuesWithComments({ since }: { since?: string } = {}): Promise<Issue[]> {
	let cursor: string | null = null;
	let hasNextPage = true;
	const allIssues: Issue[] = [];

	while (hasNextPage) {
		const issues = await fetchIssuesWithComments({ cursor, since });

		const filteredResults = issues.nodes.map(toFormattedIssue);

		allIssues.push(...filteredResults);

		cursor = issues.pageInfo.endCursor;
		hasNextPage = issues.pageInfo.hasNextPage;
	}

	return allIssues;
}

export async function fetchIssuesWithComments({ cursor, since }: { cursor?: string | null; since?: string } = {}): Promise<any> {
	const cursorParam = cursor ? `, after: "${cursor}"` : '';
	const sinceParam = since ? `, filterBy: { since: "${since}" }` : '';

	const query = `
		query {
			repository(owner: "cloudflare", name: "workers-sdk") {
				issues(first: 100 ${sinceParam} ${cursorParam}) {
					nodes {
						${issueQuery}
					}
					pageInfo {
						hasNextPage
						endCursor
					}
				}
			}
		}
  `;

	const res = await fetchGraphQlResponse<GitHubRepoIssuesResponse>(query);

	return res.data.repository.issues;
}

type GitHubRepoIssuesResponse = {
	data: {
		repository: {
			issues: {
				pageInfo: {
					endCursor: string;
					hasNextPage: boolean;
				};
				nodes: GitHubIssueNode[];
			};
		};
	};
};
