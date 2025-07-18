import { useAtomValue, useSetAtom } from 'jotai';
import * as React from 'react';
import { useState } from 'react';
import { activeFileAtom, saveFileAtom } from '../../atoms/editor';
import { EditorContext } from '../../context/EditorContext';
import { MarkdownProblemListsProvider } from '../../context/MarkdownProblemListsContext';
import { ProblemSuggestionModalProvider } from '../../context/ProblemSuggestionModalContext';
import {
  PROBLEM_DIFFICULTY_OPTIONS,
  ProblemMetadata,
} from '../../models/problem';
import { formatMarkdown } from '../../utils/prettierFormatter';
import QuizGeneratorModal from '../QuizGeneratorModal';

const RawMarkdownRenderer = React.lazy(
  () => import('../DynamicMarkdownRenderer/DynamicMarkdownRenderer')
);

export const EditorOutput = (): JSX.Element => {
  const activeFile = useAtomValue(activeFileAtom);
  const saveFile = useSetAtom(saveFileAtom);

  const markdown: string = activeFile?.markdown ?? '';
  const problems: string = activeFile?.problems ?? '';

  const [
    markdownProblemListsProviderValue,
    setMarkdownProblemListsProviderValue,
  ] = useState<{ listId: string; problems: any }[]>([]);
  React.useEffect(() => {
    try {
      const parsedProblems = JSON.parse(problems || '{}');
      const problemsList = Object.keys(parsedProblems)
        .filter(key => key !== 'MODULE_ID')
        .map(key => ({
          listId: key,
          problems: parsedProblems[key],
        }));
      setMarkdownProblemListsProviderValue(problemsList);
    } catch (e) {
      console.log(e);
    }
  }, [problems]);

  const handleAddProblem = async (
    listId: string,
    problemMetadata: ProblemMetadata
  ) => {
    const parsedOldFileData = JSON.parse(problems);
    const tableToEdit = parsedOldFileData[listId];

    // sort the table such that the suggested problem is inserted below the bottommost
    // problem with the same difficulty as the suggested problem.
    parsedOldFileData[listId] = (
      [
        ...tableToEdit.map((el, i) => ({ index: i, data: el })),
        { index: tableToEdit.length, data: problemMetadata },
      ] as { index: number; data: ProblemMetadata }[]
    )
      .sort((a, b) => {
        const difficultyDiff =
          PROBLEM_DIFFICULTY_OPTIONS.indexOf(a.data.difficulty) -
          PROBLEM_DIFFICULTY_OPTIONS.indexOf(b.data.difficulty);
        return difficultyDiff !== 0 ? difficultyDiff : a.index - b.index;
      })
      .map(prob => prob.data);

    // Use pretty JSON.stringify because it inserts a newline before all objects, which forces prettier to then convert
    // these objects into multiline ones.
    const newContent = JSON.stringify(parsedOldFileData, null, 2) + '\n';
    const formattedNewContent = await formatMarkdown(newContent);
    saveFile({
      path: activeFile!.path,
      update: async prev => ({
        ...prev,
        problems: formattedNewContent,
      }),
    });
  };

  return (
    <div className="markdown p-4">
      <React.Suspense fallback={<p>Loading...</p>}>
        <EditorContext.Provider
          value={{
            addProblem: handleAddProblem,
            inEditor: true,
          }}
        >
          <MarkdownProblemListsProvider
            value={markdownProblemListsProviderValue}
          >
            <ProblemSuggestionModalProvider>
              <RawMarkdownRenderer markdown={markdown} problems={problems} />
              <QuizGeneratorModal />
            </ProblemSuggestionModalProvider>
          </MarkdownProblemListsProvider>
        </EditorContext.Provider>
      </React.Suspense>
    </div>
  );
};
