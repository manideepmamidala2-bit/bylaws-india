import ClausesPage, {
  generateStaticParams as generateClausesParams,
} from "../clauses/page";

export const dynamicParams = false;
export const generateStaticParams = generateClausesParams;
export default ClausesPage;
