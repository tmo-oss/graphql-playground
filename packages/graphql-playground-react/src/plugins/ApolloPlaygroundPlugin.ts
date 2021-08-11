import {GraphQLRequestData} from "../components/Playground/util/makeOperation";
import {LinkCreatorProps} from "../state/sessions/fetchingSagas";

export interface ApolloPlaygroundPlugin {
  init?: () => Promise<any> | void
  preRequest?: (request: GraphQLRequestData, linkProperties: LinkCreatorProps) => Promise<any> | void
}
