import { Transition } from '@headlessui/react';
import { graphql, useStaticQuery } from 'gatsby';
import React, { Fragment, useEffect } from 'react';
import { moduleIDToURLMap } from '../../../../../content/ordering';
import {
  useDivisionTableQuery,
  useSetDivisionTableQuery,
} from '../../../../context/UserDataContext/properties/simpleProperties';
import {
  ProblemDifficulty,
  ProblemSolutionInfo,
} from '../../../../models/problem';
import { ProblemsList } from '../ProblemsList';
import contestToPoints from './contest_to_points.json';
import divToProbs from './div_to_probs.json';
import { DivisionProblemInfo } from './DivisionProblemInfo';
import idToSol from './id_to_sol.json';

const startYear = 2016;
const endYear = 2025; // manually increment this for a new season
const allYears = `All (${startYear - 1} - ${endYear})`;
const divisions = ['Bronze', 'Silver', 'Gold', 'Platinum'];

const getSeasons = () => {
  const res: string[] = [];
  for (let i = startYear; i <= endYear; ++i) {
    res.push(`${i - 1} - ${i}`);
  }
  res.push(allYears);
  res.reverse();
  return res;
};
const seasons = getSeasons();

const color: { [key: string]: string } = {
  Bronze: 'bg-red-800',
  Silver: 'bg-gray-400',
  Gold: 'bg-yellow-300',
  Platinum: 'bg-gray-200',
};

const getCircle = option => {
  return (
    divisions.includes(option) && (
      <span className="inline-block h-5 w-5 p-0.5">
        <span
          className={`inline-block h-4 w-4 rounded-full ${color[option]}`}
        />
      </span>
    )
  );
};

const DivisionButton = ({
  options,
  state,
  onChange,
  dropdownAbove,
}: {
  options: string[];
  state: string;
  onChange: (option: string) => void;
  dropdownAbove?: boolean;
}) => {
  const [show, setShow] = React.useState(false);
  const handleSelect = option => {
    setShow(false);
    onChange(option);
  };
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleClick = e => {
      if (ref.current?.contains(e.target)) return;
      setShow(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div>
        <span className="rounded-md shadow-sm">
          <button
            type="button"
            className={`inline-flex w-full justify-center rounded-md border border-gray-300 pr-4 dark:border-gray-800 ${
              getCircle(state) ? 'pl-3' : 'pl-4'
            } dark:text-dark-high-emphasis dark:hover:text-dark-high-emphasis focus:shadow-outline-blue bg-white py-2 text-sm leading-5 font-medium text-gray-700 transition duration-150 ease-in-out hover:text-gray-500 focus:border-blue-300 focus:outline-hidden dark:bg-gray-900`}
            id="options-menu"
            aria-haspopup="true"
            aria-expanded="true"
            onClick={() => setShow(!show)}
            disabled={options.length === 1}
          >
            {getCircle(state)}

            <span className={`flex-1 ${getCircle(state) ? 'ml-2' : ''}`}>
              {state}
            </span>

            <svg
              className="-mr-1 ml-2 h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </span>
      </div>

      <Transition
        show={show}
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div
          className={`${
            dropdownAbove
              ? 'bottom-0 mb-12 origin-bottom-right'
              : 'origin-top-right'
          } absolute right-0 z-10 mt-2 rounded-md shadow-lg`} // w-36
        >
          <div className="rounded-md bg-white shadow-xs dark:bg-gray-900">
            <div
              className="py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="options-menu"
            >
              {options.map(option => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className="dark:text-dark-high-emphasis dark:hover:text-dark-high-emphasis flex w-full items-center px-3 py-2 text-left text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-hidden dark:hover:bg-gray-700"
                  role="menuitem"
                >
                  {getCircle(option)}
                  <span className={`flex-1 ${getCircle(option) ? 'ml-2' : ''}`}>
                    {option}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export function DivisionList(props): JSX.Element {
  const data: Queries.DivisionListQuery = useStaticQuery(graphql`
    query DivisionList {
      allProblemInfo(
        filter: { source: { in: ["Bronze", "Silver", "Gold", "Platinum"] } }
      ) {
        nodes {
          solution {
            kind
            label
            labelTooltip
            sketch
            url
            hasHints
          }
          uniqueId
          url
          tags
          difficulty
          module {
            frontmatter {
              id
            }
          }
        }
      }
    }
  `);
  const probToLink: { [key: string]: string } = {};
  const probToURL: { [key: string]: string } = {};
  const probToTags: { [key: string]: string[] } = {};
  const probToDifficulty: { [key: string]: ProblemDifficulty } = {};
  const probToSol: { [key: string]: ProblemSolutionInfo } = {};
  for (const node of data.allProblemInfo.nodes) {
    const problem = node;
    const uniqueId = problem.uniqueId;
    probToLink[uniqueId] =
      problem.module! &&
      `${moduleIDToURLMap[problem.module.frontmatter.id]}/#problem-${uniqueId}`;
    probToURL[uniqueId] = problem.url;
    const prevTags = probToTags[uniqueId] || [];
    const allTags = prevTags.concat(problem.tags);
    probToTags[uniqueId] = [...new Set(allTags)];
    probToDifficulty[uniqueId] = problem.difficulty as ProblemDifficulty;
    // https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
    probToSol[uniqueId] = problem.solution as ProblemSolutionInfo;
  }
  const divisionToSeasonToProbs: {
    [key: string]: { [key: string]: DivisionProblemInfo[] };
  } = {};
  const contestToFraction: {
    [key: string]: { [key: string]: number[] };
  } = {};
  for (const division of divisions) {
    divisionToSeasonToProbs[division] = {};
    contestToFraction[division] = {};
  }

  for (const division of divisions) {
    for (const contest of Object.keys(contestToPoints[division])) {
      contestToFraction[division][contest] = [];
      if (contestToPoints[division][contest]) {
        for (const num of contestToPoints[division][contest]) {
          contestToFraction[division][contest].push(num);
        }
      }
    }
  }

  for (const division of divisions) {
    for (const probInfo of divToProbs[division]) {
      const contest = probInfo[1];
      let fraction = 0;
      if (contest in contestToFraction[division]) {
        fraction = contestToFraction[division][contest].shift()!;
      }
      const id = `usaco-${probInfo[0]}`;
      const prob: DivisionProblemInfo = {
        name: probInfo[2],
        uniqueId: id,
        solution: probToSol[id] || {
          kind: 'link',
          label: 'External Sol',
          url: `http://www.usaco.org/current/data/${idToSol[probInfo[0]]}`,
        },
        moduleLink: probToLink[id],
        percentageSolved: fraction,
        tags: probToTags[id],
        difficulty: probToDifficulty[id],
        url:
          probToURL[id] ||
          'http://www.usaco.org/index.php?page=viewproblem2&cpid=' +
            probInfo[0], // problems not in modules won't have URLs
        source: contest,
      };
      let year = +probInfo[1].substring(0, 4);
      if (probInfo[1].includes('December')) {
        year++;
      }
      const season = `${year - 1} - ${year}`;
      if (!(season in divisionToSeasonToProbs[division])) {
        divisionToSeasonToProbs[division][season] = [];
      }
      divisionToSeasonToProbs[division][season].push(prob);
      if (!(allYears in divisionToSeasonToProbs[division])) {
        divisionToSeasonToProbs[division][allYears] = [];
      }
      divisionToSeasonToProbs[division][allYears].push(prob);
    }
  }

  const divisionTableQuery = useDivisionTableQuery();
  const setDivisionTableQuery = useSetDivisionTableQuery();

  const [divisionHash, setDivisionHash] = React.useState('');
  const [seasonHash, setSeasonHash] = React.useState('');
  let curDivision =
    divisionHash || (divisionTableQuery && divisionTableQuery.division);
  if (!divisions.includes(curDivision)) curDivision = divisions[0];

  let curSeason =
    seasonHash || (divisionTableQuery && divisionTableQuery.season);
  if (!seasons.includes(curSeason)) curSeason = seasons[seasons.length - 1];

  useEffect(() => {
    // https://dev.to/vvo/how-to-solve-window-is-not-defined-errors-in-react-and-next-js-5f97
    // oops is this the correct way to do this
    const hash = window.location.hash;
    if (hash) {
      for (const division of divisions) {
        for (const season of seasons) {
          for (const prob of divisionToSeasonToProbs[division][season]) {
            if ('#problem-' + prob.uniqueId === hash) {
              setDivisionHash(division);
              setSeasonHash(season);
            }
          }
        }
      }
    }
  }, []);

  const problems: DivisionProblemInfo[] =
    divisionToSeasonToProbs[curDivision][curSeason];

  const someHavePercent = problems.some(problem => !!problem.percentageSolved);
  const sortOrders = ['By Contest'];
  if (someHavePercent) sortOrders.push('By Percent');
  const [sortOrder, setSortOrder] = React.useState('Sort: ' + sortOrders[0]);
  const sortedProblems = React.useMemo(() => {
    if (!someHavePercent) return problems;
    return [...problems].sort(
      (a, b) => (b.percentageSolved || 0) - (a.percentageSolved || 0)
    );
  }, [problems]);

  return (
    <>
      <div className="mb-4 flex items-center space-x-4">
        <DivisionButton
          options={divisions}
          state={curDivision}
          onChange={newDivision => {
            if (curDivision === newDivision) return;
            setDivisionHash('');
            setSeasonHash('');
            setDivisionTableQuery({
              division: newDivision,
              season: curSeason,
            });
          }}
        />
        <DivisionButton
          options={seasons}
          state={curSeason}
          onChange={newSeason => {
            if (curSeason === newSeason) return;
            setDivisionHash('');
            setSeasonHash('');
            setDivisionTableQuery({
              division: curDivision,
              season: newSeason,
            });
          }}
        />
        {sortOrders.length > 1 && (
          <DivisionButton
            options={sortOrders}
            state={sortOrder}
            onChange={newOrder => {
              setSortOrder('Sort: ' + newOrder);
            }}
          />
        )}
      </div>

      <ProblemsList
        problems={sortOrder.endsWith('Percent') ? sortedProblems : problems}
        division={curDivision}
        modules={true}
      />
    </>
  );
}
